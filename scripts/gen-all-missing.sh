#!/bin/bash
# Generate all 40 missing recipe images sequentially
export GEMINI_API_KEY=AIzaSyCbxvYvFpTwC9Bc2-OdXvLoNNgr9HdmXoY
OUT="/Users/coleb/dev/kifted-builds/kifted/public/images/recipes"
mkdir -p "$OUT"
COUNT=0
TOTAL=40

generate() {
  local id="$1"
  local prompt="$2"
  if [ -f "$OUT/$id.png" ]; then echo "SKIP $id (exists)"; return; fi
  COUNT=$((COUNT + 1))
  echo "[$COUNT/$TOTAL] GENERATING $id..."
  rm -f nanobanana-output/*.png
  gemini --yolo -p "/generate '$prompt'" 2>/dev/null
  local file=$(ls -t nanobanana-output/*.png 2>/dev/null | head -1)
  if [ -n "$file" ]; then cp "$file" "$OUT/$id.png"; echo "  OK -> $id.png"; else echo "  FAILED $id"; fi
}

# Poultry (remaining)
generate "marry-me-chicken-pasta" "Professional food photography of creamy pasta with chicken and sun-dried tomatoes in a rich cream sauce, warm lighting, 45 degree angle, photorealistic, no text no watermarks"
generate "one-pot-chicken-ramen" "Professional food photography of chicken ramen in a deep bowl with soft-boiled egg, noodles, spring onions, warm lighting, 45 degree angle, photorealistic, no text no watermarks"
generate "creamy-tomato-chicken-sandwich" "Professional food photography of a chicken sandwich with creamy tomato filling and rocket leaves on crusty bread, warm lighting, side angle, photorealistic, no text no watermarks"
generate "crispy-honey-sriracha-tenders" "Professional food photography of crispy golden chicken tenders drizzled with honey sriracha glaze, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "peri-peri-chicken" "Professional food photography of charred peri peri chicken thighs with rice, corn on the cob and coleslaw, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "chicken-bacon-bulking-salad" "Professional food photography of a hearty salad with grilled chicken, crispy bacon, avocado, cherry tomatoes on mixed greens, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "one-pot-garlic-chicken-rice" "Professional food photography of creamy garlic chicken with rice and wilted spinach in a cast iron pot, warm lighting, 45 degree angle, photorealistic, no text no watermarks"

# Fish (remaining)
generate "easy-tuna-pasta-salad" "Professional food photography of a tuna pasta salad with sweetcorn, red onion, light mayo dressing, in a bowl, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "salmon-poke-bowl" "Professional food photography of a salmon poke bowl with sushi rice, avocado, cucumber, edamame, sesame seeds, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "sweet-chilli-glazed-salmon" "Professional food photography of sweet chilli glazed salmon fillet with rice noodles and pak choi, warm lighting, 45 degree angle, photorealistic, no text no watermarks"
generate "homemade-fish-finger-sandwich" "Professional food photography of a crispy fish finger sandwich with tartare sauce and lettuce on a bread roll, warm lighting, side angle, photorealistic, no text no watermarks"
generate "crispy-sriracha-prawn-black-rice" "Professional food photography of crispy sriracha prawns served over black rice with spring onions, warm lighting, overhead shot, photorealistic, no text no watermarks"

# Beef (remaining)
generate "low-carb-loaf-tin-lasagne" "Professional food photography of a slice of lasagne with layers of meat sauce, pasta and melted cheese, warm lighting, side angle, photorealistic, no text no watermarks"
generate "creamy-sausage-pasta" "Professional food photography of creamy sausage pasta with penne in a light creamy tomato sauce, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "beef-ramen-noodles" "Professional food photography of beef ramen with thin sliced steak, soft-boiled egg, pak choi in rich broth, warm lighting, 45 degree angle, photorealistic, no text no watermarks"
generate "homemade-beef-crunch-wraps" "Professional food photography of a golden crunchy beef wrap cut in half showing layers of meat, cheese, sour cream, warm lighting, side angle, photorealistic, no text no watermarks"
generate "meatball-chilli-con-carne" "Professional food photography of meatballs in a rich spicy chilli sauce with kidney beans, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "spicy-korean-beef-wraps" "Professional food photography of Korean beef wraps with gochujang marinated beef, rice, pickled vegetables, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "homemade-smash-burgers" "Professional food photography of a double smash burger with melted American cheese, pickles, sauce on a brioche bun, warm lighting, side angle, photorealistic, no text no watermarks"

# Breakfast
generate "sweet-potato-chorizo-hash" "Professional food photography of a sweet potato hash with crispy chorizo and two fried eggs on top, in a cast iron skillet, warm lighting, overhead shot, photorealistic, no text no watermarks"

# M&S
generate "ms-buffalo-chicken-sliders" "Professional food photography of buffalo chicken sliders with melted cheese on mini brioche buns, warm lighting, side angle, photorealistic, no text no watermarks"

# Vegetarian
generate "roasted-veg-feta-tart" "Professional food photography of a roasted vegetable and crumbled feta puff pastry tart, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "one-tray-halloumi-wraps" "Professional food photography of grilled halloumi wraps with roasted peppers, courgette and hummus, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "halloumi-harissa-bake" "Professional food photography of a one-pan halloumi bake with harissa, aubergine, chickpeas, cherry tomatoes, warm lighting, overhead shot, photorealistic, no text no watermarks"

# Plant-based
generate "one-pot-lentil-dahl" "Professional food photography of a rich golden lentil dahl in a bowl with naan bread on the side, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "vegan-meatball-sub" "Professional food photography of a vegan meatball sub sandwich with marinara sauce in a crusty sub roll, warm lighting, side angle, photorealistic, no text no watermarks"
generate "vegan-fajitas" "Professional food photography of vegan fajitas with portobello mushrooms, peppers, onions in tortillas with guacamole, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "crispy-tofu-teriyaki-noodles" "Professional food photography of crispy golden tofu on teriyaki noodles with broccoli, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "vegan-lentil-bolognese" "Professional food photography of lentil bolognese over spaghetti with fresh basil, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "buffalo-cauliflower-tacos" "Professional food photography of buffalo cauliflower tacos with avocado and red cabbage slaw in corn tortillas, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "vegan-mac-n-cheese" "Professional food photography of creamy vegan mac and cheese in a bowl, golden and cheesy looking, warm lighting, overhead shot, photorealistic, no text no watermarks"

# Sweet
generate "protein-cheesecake" "Professional food photography of a protein cheesecake slice on a plate with a biscuit base, smooth creamy top, warm lighting, side angle, photorealistic, no text no watermarks"
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
echo "DONE. Total images now:"
ls -1 "$OUT"/*.png | wc -l
