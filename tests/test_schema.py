from drf_spectacular.generators import SchemaGenerator


def test_key_endpoints_expose_request_and_response_schema():
    generator = SchemaGenerator()
    schema = generator.get_schema(request=None, public=True)
    paths = schema["paths"]

    login_post = paths["/api/v1/auth/login/"]["post"]
    assert login_post.get("requestBody") is not None
    assert login_post["responses"]["200"]["content"] is not None

    dashboard_get = paths["/api/v1/dashboard/"]["get"]
    assert dashboard_get["responses"]["200"]["content"] is not None

    incidents_get = paths["/api/v1/incidents/"]["get"]
    assert incidents_get["responses"]["200"]["content"] is not None
