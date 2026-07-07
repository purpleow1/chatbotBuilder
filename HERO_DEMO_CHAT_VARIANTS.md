# Hero Demo Chat Variants

Final conversation options for the landing page hero demo chat. These are based
on the core AskDoc use cases in `USE_CASES.md` and use different conversation
lengths.

## Variant 1: Customer Support

Message count: 2

Bot label: `Support Desk Bot`  
Subtitle: `Customer support assistant`

Customer:
> How do I change the shipping address on an order I placed today?

Assistant:
> If the order has not shipped yet, you can update the address from Order Details. If it is already processing, contact support with the order number so the team can try to reroute it.

Sources:
- `shipping-policy.pdf`
- `order-help.md`

## Variant 2: Website Conversion

Message count: 3

Bot label: `Product Guide Bot`  
Subtitle: `Website conversion assistant`

Visitor:
> We are comparing plans. Which one works best for a growing support team?

Assistant:
> The Growth plan is usually the best fit. It includes more document capacity, website widget publishing, lead capture, and team collaboration.

Visitor:
> Can I see how it compares with Pro before booking a demo?

Sources:
- `pricing-page.md`
- `plan-comparison.pdf`

## Variant 3: Internal Knowledge

Message count: 4

Bot label: `Team Handbook Bot`  
Subtitle: `Internal knowledge assistant`

Employee:
> Where do new hires request equipment?

Assistant:
> New hires request laptops, monitors, and security keys through the People Ops equipment form before their start date.

Employee:
> Is security training required too?

Assistant:
> Yes. Security training is assigned during week one and must be completed within 5 business days.

Sources:
- `employee-handbook.pdf`
- `onboarding-checklist.md`

## Recommended Hero Pick

Use Variant 2 for the main hero demo. It directly supports the website
conversion use case: helping visitors understand the product, compare plans, and
get useful answers before booking a demo or contacting support.
