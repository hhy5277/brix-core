---
layout: post
title: Manual
---

{% for category in site.categories %}
  {% if category[0] == 'articles' %}
  {% assign posts = category[1] %}
  {% include archive.html %}
  {% endif %}
{% endfor %}