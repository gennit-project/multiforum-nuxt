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
    description = "Multiforum HTTP (replace with TLS before production use)"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
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
    backend_image  = var.backend_image
    frontend_image = var.frontend_image
    repository_ref = var.repository_ref
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
