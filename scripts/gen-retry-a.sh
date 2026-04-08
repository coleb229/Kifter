#!/bin/bash
# GEMINI_API_KEY must be set in environment before running
OUT="/Users/coleb/dev/kifted-builds/kifted/public/images/recipes"
WORKDIR=$(mktemp -d)
cd "$WORKDIR"

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

generate "low-carb-loaf-tin-lasagne" "Professional food photography of a slice of lasagne with layers of meat sauce, pasta and melted cheese, warm lighting, side angle, photorealistic, no text no watermarks"
generate "creamy-sausage-pasta" "Professional food photography of creamy sausage pasta with penne in a light creamy tomato sauce, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "beef-ramen-noodles" "Professional food photography of beef ramen with thin sliced steak, soft-boiled egg, pak choi in rich broth, warm lighting, 45 degree angle, photorealistic, no text no watermarks"
generate "homemade-beef-crunch-wraps" "Professional food photography of a golden crunchy beef wrap cut in half showing layers of meat, cheese, sour cream, warm lighting, side angle, photorealistic, no text no watermarks"
generate "meatball-chilli-con-carne" "Professional food photography of meatballs in a rich spicy chilli sauce with kidney beans, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "spicy-korean-beef-wraps" "Professional food photography of Korean beef wraps with gochujang marinated beef, rice, pickled vegetables, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "homemade-smash-burgers" "Professional food photography of a double smash burger with melted American cheese, pickles, sauce on a brioche bun, warm lighting, side angle, photorealistic, no text no watermarks"
generate "sweet-potato-chorizo-hash" "Professional food photography of a sweet potato hash with crispy chorizo and two fried eggs on top, in a cast iron skillet, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "one-tray-halloumi-wraps" "Professional food photography of grilled halloumi wraps with roasted peppers, courgette and hummus, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "halloumi-harissa-bake" "Professional food photography of a one-pan halloumi bake with harissa, aubergine, chickpeas, cherry tomatoes, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "one-pot-lentil-dahl" "Professional food photography of a rich golden lentil dahl in a bowl with naan bread on the side, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "vegan-meatball-sub" "Professional food photography of a vegan meatball sub sandwich with marinara sauce in a crusty sub roll, warm lighting, side angle, photorealistic, no text no watermarks"

echo "RETRY-A DONE"; rm -rf "$WORKDIR"
