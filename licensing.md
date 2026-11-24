# Licensing

[Documentation](README.md) › Licensing

Relay Community needs no licence. Relay Enterprise features need one, which comes in two forms:

- **A subscription** (the usual way). Customers subscribe monthly or yearly on the vendor's
  licence server, receive an activation key by email, and paste it into Relay. Relay checks
  in with the licence server every six hours.
- **An offline key**, for servers that cannot reach the internet. The vendor issues it by
  hand; it names the customer, seats, features and an end date, and needs no check-in.

## For customers

### Subscribing

1. Choose monthly or yearly billing and the number of members on the vendor's subscription
   page, then pay.
2. You receive an email with your **activation key** and a link to **manage your
   subscription**.
3. In Relay, open **Administration → License**, paste the key under **Subscription** and
   choose **Activate**.

Relay checks in with the licence server every six hours and receives a lease valid for 14
days. If it cannot reach the server (an outage, a firewall change), enterprise features keep
working until the lease runs out; **Check now** tries again at once. If the licence server
says the subscription is no longer active, enterprise features switch off at once.

From the link in your email you can see your subscription, cancel it (it stays active until
the end of the period you paid for), or get a new activation key. A new key stops the old one
working; use it to move Relay to a new server. One activation key works on one Relay server at
a time.

### Offline keys

Open **Administration → License → Offline licence key**, paste the key and choose **Install
licence**. While an offline key is valid it takes precedence over a subscription.

### What a licence covers

The page shows who the licence is for, how many member and guest seats are used out of
those allowed, which enterprise features are on, and until when.

- **Seats:** active members count against the seat limit. Bots and livechat visitors never
  count, and guests have their own limit. When every seat is taken, new members cannot join
  until a seat is freed or the licence is extended. Nobody is ever deactivated to make room.
- **When a licence ends** (expired, cancelled, unpaid or removed), enterprise features switch
  off. Chat keeps working and your data is untouched; protections stay in force: rooms that
  require attributes stay restricted, and legal holds still prevent deletion.

