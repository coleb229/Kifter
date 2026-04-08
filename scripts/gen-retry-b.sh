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

generate "vegan-fajitas" "Professional food photography of vegan fajitas with portobello mushrooms, peppers, onions in tortillas with guacamole, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "crispy-tofu-teriyaki-noodles" "Professional food photography of crispy golden tofu on teriyaki noodles with broccoli, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "vegan-lentil-bolognese" "Professional food photography of lentil bolognese over spaghetti with fresh basil, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "buffalo-cauliflower-tacos" "Professional food photography of buffalo cauliflower tacos with avocado and red cabbage slaw in corn tortillas, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "hp-protein-cookie" "Professional food photography of a large golden protein cookie with chocolate chips, slightly cracked surface, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "fudgey-protein-brownies" "Professional food photography of fudgy chocolate brownies stacked on a plate, rich dark chocolate color, warm lighting, side angle, photorealistic, no text no watermarks"
generate "protein-balls" "Professional food photography of chocolate protein balls in a bowl, rolled in oats, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "air-fryer-pizza" "Professional food photography of a crispy tortilla pizza with melted mozzarella and toppings, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "air-fryer-buffalo-wings" "Professional food photography of crispy buffalo chicken wings tossed in sauce, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "air-fryer-teriyaki-salmon" "Professional food photography of teriyaki glazed salmon bowl with sushi rice, avocado, cucumber, edamame, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "air-fryer-chicken-skewers" "Professional food photography of grilled chicken skewers on a plate with couscous and salad, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "air-fryer-popcorn-chicken" "Professional food photography of crispy golden popcorn chicken bites in a bowl with dipping sauce, warm lighting, overhead shot, photorealistic, no text no watermarks"

echo "RETRY-B DONE"; rm -rf "$WORKDIR"
