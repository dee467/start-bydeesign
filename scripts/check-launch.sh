#!/bin/sh
# Fails if a page still holds launch placeholders or an expiring Stripe link.
# Run before publishing: sh scripts/check-launch.sh
status=0
for f in decode/index.html; do
  if grep -q '\[X\]' "$f"; then echo "FAIL: $f still contains [X]"; status=1; fi
  if grep -q 'CHECKOUT_URL' "$f"; then echo "FAIL: $f still contains CHECKOUT_URL"; status=1; fi
  # A checkout.stripe.com/.../cs_live_ URL is a single Checkout Session that expires. Use a buy.stripe.com Payment Link.
  if grep -q 'checkout\.stripe\.com/[a-z]/pay/cs_' "$f"; then echo "FAIL: $f links to an expiring Stripe Checkout Session; use a Payment Link"; status=1; fi
done
[ $status -eq 0 ] && echo "OK: no launch placeholders found"
exit $status
