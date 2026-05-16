import re


def normalize_phone(phone):
    digits = re.sub(r'\D', '', phone)
    if digits.startswith('00966'):
        digits = digits[5:]
    elif digits.startswith('966'):
        digits = digits[3:]
    elif digits.startswith('0'):
        digits = digits[1:]
    return f'+966{digits}'
