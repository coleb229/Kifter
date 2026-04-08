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
  echo "[B4] GENERATING $id..."
  rm -f nanobanana-output/*.png 2>/dev/null
  gemini --yolo -p "/generate '$prompt'" 2>/dev/null
  local file=$(ls -t nanobanana-output/*.png 2>/dev/null | head -1)
  if [ -n "$file" ]; then cp "$file" "$OUT/$id.png"; echo "[B4] OK $id"; else echo "[B4] FAILED $id"; fi
}

generate "vegan-mac-n-cheese" "Professional food photography of creamy vegan mac and cheese in a bowl, golden and cheesy looking, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "protein-cheesecake" "Professional food photography of a protein cheesecake slice on a plate with a biscuit base, smooth creamy top, warm lighting, side angle, photorealistic, no text no watermarks"
generate "hp-protein-cookie" "Professional food photography of a large golden protein cookie with chocolate chips, slightly cracked surface, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "fudgey-protein-brownies" "Professional food photography of fudgy chocolate brownies stacked on a plate, rich dark chocolate color, warm lighting, side angle, photorealistic, no text no watermarks"
generate "protein-balls" "Professional food photography of chocolate protein balls in a bowl, rolled in oats, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "air-fryer-pizza" "Professional food photography of a crispy tortilla pizza with melted mozzarella and toppings, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "air-fryer-buffalo-wings" "Professional food photography of crispy buffalo chicken wings tossed in sauce, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "air-fryer-teriyaki-salmon" "Professional food photography of teriyaki glazed salmon bowl with sushi rice, avocado, cucumber, edamame, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "air-fryer-chicken-skewers" "Professional food photography of grilled chicken skewers on a plate with couscous and salad, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "air-fryer-popcorn-chicken" "Professional food photography of crispy golden popcorn chicken bites in a bowl with dipping sauce, warm lighting, overhead shot, photorealistic, no text no watermarks"

echo "[B4] DONE"; rm -rf "$WORKDIR"
