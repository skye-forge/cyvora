from shared.enums.certification import PaymentProvider
from . import momo_client, orange_money_client, card_client

_CLIENTS = {
    PaymentProvider.MOMO.value: momo_client,
    PaymentProvider.ORANGE_MONEY.value: orange_money_client,
    PaymentProvider.CARD.value: card_client,
}


def initiate(*, payment) -> dict:
    client = _CLIENTS.get(payment.provider)
    if client is None:
        raise ValueError(f"Unsupported payment provider: {payment.provider}")
    return client.initiate_payment(payment=payment)


def parse_webhook(*, provider: str, payload: dict) -> dict:
    client = _CLIENTS.get(provider)
    if client is None:
        raise ValueError(f"Unsupported payment provider: {provider}")
    return client.verify_webhook_payload(payload)
