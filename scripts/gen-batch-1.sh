#!/bin/bash
export GEMINI_API_KEY=AIzaSyCbxvYvFpTwC9Bc2-OdXvLoNNgr9HdmXoY
OUT="/Users/coleb/dev/kifted-builds/kifted/public/images/recipes"
WORKDIR=$(mktemp -d)
cd "$WORKDIR"
mkdir -p "$OUT"

generate() {
  local id="$1"
  local prompt="$2"
  if [ -f "$OUT/$id.png" ]; then echo "SKIP $id"; return; fi
  echo "[B1] GENERATING $id..."
  rm -f nanobanana-output/*.png 2>/dev/null
  gemini --yolo -p "/generate '$prompt'" 2>/dev/null
  local file=$(ls -t nanobanana-output/*.png 2>/dev/null | head -1)
  if [ -n "$file" ]; then cp "$file" "$OUT/$id.png"; echo "[B1] OK $id"; else echo "[B1] FAILED $id"; fi
}

generate "marry-me-chicken-pasta" "Professional food photography of creamy pasta with chicken and sun-dried tomatoes in a rich cream sauce, warm lighting, 45 degree angle, photorealistic, no text no watermarks"
generate "one-pot-chicken-ramen" "Professional food photography of chicken ramen in a deep bowl with soft-boiled egg, noodles, spring onions, warm lighting, 45 degree angle, photorealistic, no text no watermarks"
generate "creamy-tomato-chicken-sandwich" "Professional food photography of a chicken sandwich with creamy tomato filling and rocket leaves on crusty bread, warm lighting, side angle, photorealistic, no text no watermarks"
generate "crispy-honey-sriracha-tenders" "Professional food photography of crispy golden chicken tenders drizzled with honey sriracha glaze, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "peri-peri-chicken" "Professional food photography of charred peri peri chicken thighs with rice, corn on the cob and coleslaw, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "chicken-bacon-bulking-salad" "Professional food photography of a hearty salad with grilled chicken, crispy bacon, avocado, cherry tomatoes on mixed greens, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "one-pot-garlic-chicken-rice" "Professional food photography of creamy garlic chicken with rice and wilted spinach in a cast iron pot, warm lighting, 45 degree angle, photorealistic, no text no watermarks"
generate "easy-tuna-pasta-salad" "Professional food photography of a tuna pasta salad with sweetcorn, red onion, light mayo dressing, in a bowl, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "salmon-poke-bowl" "Professional food photography of a salmon poke bowl with sushi rice, avocado, cucumber, edamame, sesame seeds, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "sweet-chilli-glazed-salmon" "Professional food photography of sweet chilli glazed salmon fillet with rice noodles and pak choi, warm lighting, 45 degree angle, photorealistic, no text no watermarks"

echo "[B1] DONE"; rm -rf "$WORKDIR"
