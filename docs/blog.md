---
layout: page
title: Blog
permalink: /blog/
---

# Blog

Stay updated with the latest Multiforum news, feature updates, and community stories.

<div class="posts">
  {% for post in site.posts %}
    <article class="post">
      <header>
        <h2><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h2>
        <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%B %d, %Y" }}</time>
      </header>
      
      {% if post.excerpt %}
        <div class="excerpt">
          {{ post.excerpt | markdownify }}
        </div>
      {% endif %}
      
      <a href="{{ post.url | relative_url }}" class="read-more">Read more →</a>
    </article>
  {% endfor %}
</div>

{% if site.posts.size == 0 %}
  <p>No blog posts yet. Check back soon for updates!</p>
{% endif %}