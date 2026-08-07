data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

data "aws_ssm_parameter" "ubuntu_ami" {
  name            = "/aws/service/canonical/ubuntu/server/24.04/stable/current/amd64/hvm/ebs-gp3/ami-id"
  with_decryption = false
}

resource "aws_security_group" "multiforum" {
  name_prefix = "${var.name}-"
  description = "Network access for the Multiforum single-VM example"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "SSH administration"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.admin_cidr]
  }

  ingress {
    description = "HTTP redirects and ACME validation"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.application_cidrs
  }

  ingress {
    description = "Multiforum HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.application_cidrs
  }

  ingress {
    description = "Multiforum HTTP/3"
    from_port   = 443
    to_port     = 443
    protocol    = "udp"
    cidr_blocks = var.application_cidrs
  }

  egress {
    description = "Package, image, and application outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${var.name}-host"
  }
}

resource "aws_instance" "multiforum" {
  ami                         = nonsensitive(data.aws_ssm_parameter.ubuntu_ami.value)
  instance_type               = var.instance_type
  key_name                    = var.ssh_key_name
  subnet_id                   = sort(data.aws_subnets.default.ids)[0]
  associate_public_ip_address = true
  vpc_security_group_ids      = [aws_security_group.multiforum.id]

  user_data = templatefile("${path.module}/cloud-init.tftpl", {
    acme_email      = var.acme_email
    backend_image   = var.backend_image
    caddy_image     = var.caddy_image
    domain          = var.domain
    frontend_image  = var.frontend_image
    instance_name   = var.name
    neo4j_image     = var.neo4j_image
    release_version = var.release_version
    repository_ref  = var.repository_ref
  })

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  root_block_device {
    encrypted   = true
    volume_size = var.root_volume_size_gib
    volume_type = "gp3"
  }

  lifecycle {
    # The public Canonical SSM parameter advances over time. Do not replace a
    # stateful, single-node forum merely because a newer image was published.
    ignore_changes = [ami]
  }

  tags = {
    Name = "${var.name}-host"
  }
}

resource "aws_eip" "multiforum" {
  domain   = "vpc"
  instance = aws_instance.multiforum.id

  tags = {
    Name = "${var.name}-public-ip"
  }
}
