---
layout: base.njk
title: Welcome to My Invention Hub
---

# My Invention & Feature Hub

This is the starting point for documenting and showcasing my project ideas, features, and experiments.

## Current Features & Ideas

{% if collections.features.length > 0 %}
<ul>
  {%- for feature in collections.features | reverse %} {# Optional: reverse to show newest first #}
  <li>
    <a href="{{ feature.url | url }}">{{ feature.data.title }}</a>
    {% if feature.data.status %}- <small><em>({{ feature.data.status }})</em></small>{% endif %}
  </li>
  {%- endfor %}
</ul>
{% else %}
<p>No features listed yet. Check back soon!</p>
{% endif %}