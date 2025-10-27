# Setup Instructions - Marketplace Features

## 🚨 Required: Install Dependencies

Before running `npm run dev`, you MUST install the new package:

```bash
npm install @stripe/react-stripe-js
```

Or install all dependencies:

```bash
npm install
```

## 🔑 Required Environment Variables

Get Mapbox token and add to `.env.local`:

```bash
# Get from: https://account.mapbox.com/access-tokens/
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...your-token-here
```

## ✅ Checklist Before Running Dev Server

- [ ] Run `npm install` to install all dependencies
- [ ] Add Mapbox token to `.env.local`
- [ ] Restart terminal/IDE after adding env variables
- [ ] Run `npm run dev`

## 🐛 If Still Having Issues

1. **Clear Next.js cache:**
```bash
rm -rf .next
npm run dev
```

2. **Check Node version:**
```bash
node -v  # Should be 18.x or higher
```

3. **Reinstall dependencies:**
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📱 Test Flow Once Running

1. Go to `/jobs/[id]/compare` as homeowner
2. Accept a bid
3. Payment modal should appear
4. Complete payment
5. Should redirect to `/jobs/[id]/track`
