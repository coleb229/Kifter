#!/bin/bash
# GEMINI_API_KEY must be set in environment before running
if [ -z "$GEMINI_API_KEY" ]; then echo "ERROR: Set GEMINI_API_KEY env var first"; exit 1; fi
OUT="/Users/coleb/dev/kifted-builds/kifted/public/images/recipes"
mkdir -p "$OUT"

generate() {
  local id="$1"
  local prompt="$2"
  if [ -f "$OUT/$id.png" ]; then echo "SKIP $id"; return; fi
  echo "GENERATING $id..."
  rm -f nanobanana-output/*.png 2>/dev/null
  gemini --yolo -p "/generate '$prompt'" 2>/dev/null
  local file=$(ls -t nanobanana-output/*.png 2>/dev/null | head -1)
  if [ -n "$file" ]; then cp "$file" "$OUT/$id.png"; echo "  OK $id"; else echo "  FAILED $id"; fi
}

# Beef
generate "low-carb-loaf-tin-lasagne" "Professional food photography of a slice of lasagne with layers of meat sauce, pasta and melted cheese, warm lighting, side angle, photorealistic, no text no watermarks"
generate "creamy-sausage-pasta" "Professional food photography of creamy sausage pasta with penne in a light creamy tomato sauce, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "beef-ramen-noodles" "Professional food photography of beef ramen with thin sliced steak, soft-boiled egg, pak choi in rich broth, warm lighting, 45 degree angle, photorealistic, no text no watermarks"
generate "homemade-beef-crunch-wraps" "Professional food photography of a golden crunchy beef wrap cut in half showing layers of meat, cheese, sour cream, warm lighting, side angle, photorealistic, no text no watermarks"
generate "meatball-chilli-con-carne" "Professional food photography of meatballs in a rich spicy chilli sauce with kidney beans, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "spicy-korean-beef-wraps" "Professional food photography of Korean beef wraps with gochujang marinated beef, rice, pickled vegetables, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "homemade-smash-burgers" "Professional food photography of a double smash burger with melted American cheese, pickles, sauce on a brioche bun, warm lighting, side angle, photorealistic, no text no watermarks"

# Breakfast
generate "sweet-potato-chorizo-hash" "Professional food photography of a sweet potato hash with crispy chorizo and two fried eggs on top, in a cast iron skillet, warm lighting, overhead shot, photorealistic, no text no watermarks"

# Vegetarian
generate "one-tray-halloumi-wraps" "Professional food photography of grilled halloumi wraps with roasted peppers, courgette and hummus, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "halloumi-harissa-bake" "Professional food photography of a one-pan halloumi bake with harissa, aubergine, chickpeas, cherry tomatoes, warm lighting, overhead shot, photorealistic, no text no watermarks"

# Plant-based
generate "one-pot-lentil-dahl" "Professional food photography of a rich golden lentil dahl in a bowl with naan bread on the side, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "vegan-meatball-sub" "Professional food photography of a vegan meatball sub sandwich with marinara sauce in a crusty sub roll, warm lighting, side angle, photorealistic, no text no watermarks"
generate "vegan-fajitas" "Professional food photography of vegan fajitas with portobello mushrooms, peppers, onions in tortillas with guacamole, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "crispy-tofu-teriyaki-noodles" "Professional food photography of crispy golden tofu on teriyaki noodles with broccoli, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "vegan-lentil-bolognese" "Professional food photography of lentil bolognese over spaghetti with fresh basil, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "buffalo-cauliflower-tacos" "Professional food photography of buffalo cauliflower tacos with avocado and red cabbage slaw in corn tortillas, warm lighting, overhead shot, photorealistic, no text no watermarks"

# Sweet
generate "hp-protein-cookie" "Professional food photography of a large golden protein cookie with chocolate chips, slightly cracked surface, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "fudgey-protein-brownies" "Professional food photography of fudgy chocolate brownies stacked on a plate, rich dark chocolate color, warm lighting, side angle, photorealistic, no text no watermarks"
generate "protein-balls" "Professional food photography of chocolate protein balls in a bowl, rolled in oats, warm lighting, overhead shot, photorealistic, no text no watermarks"

# Air Fryer
generate "air-fryer-pizza" "Professional food photography of a crispy tortilla pizza with melted mozzarella and toppings, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "air-fryer-buffalo-wings" "Professional food photography of crispy buffalo chicken wings tossed in sauce, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "air-fryer-teriyaki-salmon" "Professional food photography of teriyaki glazed salmon bowl with sushi rice, avocado, cucumber, edamame, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "air-fryer-chicken-skewers" "Professional food photography of grilled chicken skewers on a plate with couscous and salad, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "air-fryer-popcorn-chicken" "Professional food photography of crispy golden popcorn chicken bites in a bowl with dipping sauce, warm lighting, overhead shot, photorealistic, no text no watermarks"

echo ""
echo "DONE. Total images:"
ls -1 "$OUT"/*.png | wc -l
