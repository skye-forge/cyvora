import factory

from apps.accounts.models import User


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User
        skip_postgeneration_save = True

    name = factory.Faker("name")
    email = factory.Sequence(lambda n: f"user{n}@varnis.cm")
    phone = factory.Sequence(lambda n: f"+23767{n:07d}")
    language = "fr"
    role = "citizen"

    @factory.post_generation
    def password(self, create, extracted, **kwargs):
        self.set_password(extracted or "TestPass123")
        if create:
            self.save()
