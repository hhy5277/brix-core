---
layout: post
title: Releases
---

{% for category in site.categories %}
  {% if category[0] == 'releases' %}
  {% assign posts = category[1] %}
  {% include archive.html %}
  {% endif %}
{% endfor %}