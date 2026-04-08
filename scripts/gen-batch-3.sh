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
  echo "[B3] GENERATING $id..."
  rm -f nanobanana-output/*.png 2>/dev/null
  gemini --yolo -p "/generate '$prompt'" 2>/dev/null
  local file=$(ls -t nanobanana-output/*.png 2>/dev/null | head -1)
  if [ -n "$file" ]; then cp "$file" "$OUT/$id.png"; echo "[B3] OK $id"; else echo "[B3] FAILED $id"; fi
}

generate "ms-buffalo-chicken-sliders" "Professional food photography of buffalo chicken sliders with melted cheese on mini brioche buns, warm lighting, side angle, photorealistic, no text no watermarks"
generate "roasted-veg-feta-tart" "Professional food photography of a roasted vegetable and crumbled feta puff pastry tart, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "one-tray-halloumi-wraps" "Professional food photography of grilled halloumi wraps with roasted peppers, courgette and hummus, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "halloumi-harissa-bake" "Professional food photography of a one-pan halloumi bake with harissa, aubergine, chickpeas, cherry tomatoes, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "one-pot-lentil-dahl" "Professional food photography of a rich golden lentil dahl in a bowl with naan bread on the side, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "vegan-meatball-sub" "Professional food photography of a vegan meatball sub sandwich with marinara sauce in a crusty sub roll, warm lighting, side angle, photorealistic, no text no watermarks"
generate "vegan-fajitas" "Professional food photography of vegan fajitas with portobello mushrooms, peppers, onions in tortillas with guacamole, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "crispy-tofu-teriyaki-noodles" "Professional food photography of crispy golden tofu on teriyaki noodles with broccoli, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "vegan-lentil-bolognese" "Professional food photography of lentil bolognese over spaghetti with fresh basil, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "buffalo-cauliflower-tacos" "Professional food photography of buffalo cauliflower tacos with avocado and red cabbage slaw in corn tortillas, warm lighting, overhead shot, photorealistic, no text no watermarks"

echo "[B3] DONE"; rm -rf "$WORKDIR"
