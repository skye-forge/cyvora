from django.utils.text import slugify


def generate_unique_slug(model, value, slug_field="slug"):
    """
    Generate a unique slug for a Django model.

    Example:
        AI Safety
        -> ai-safety

        AI Safety
        -> ai-safety-2
    """

    base_slug = slugify(value)
    slug = base_slug
    counter = 2

    while model.objects.filter(**{slug_field: slug}).exists():
        slug = f"{base_slug}-{counter}"
        counter += 1

    return slug
