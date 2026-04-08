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
  echo "[B2] GENERATING $id..."
  rm -f nanobanana-output/*.png 2>/dev/null
  gemini --yolo -p "/generate '$prompt'" 2>/dev/null
  local file=$(ls -t nanobanana-output/*.png 2>/dev/null | head -1)
  if [ -n "$file" ]; then cp "$file" "$OUT/$id.png"; echo "[B2] OK $id"; else echo "[B2] FAILED $id"; fi
}

generate "homemade-fish-finger-sandwich" "Professional food photography of a crispy fish finger sandwich with tartare sauce and lettuce on a bread roll, warm lighting, side angle, photorealistic, no text no watermarks"
generate "crispy-sriracha-prawn-black-rice" "Professional food photography of crispy sriracha prawns served over black rice with spring onions, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "low-carb-loaf-tin-lasagne" "Professional food photography of a slice of lasagne with layers of meat sauce, pasta and melted cheese, warm lighting, side angle, photorealistic, no text no watermarks"
generate "creamy-sausage-pasta" "Professional food photography of creamy sausage pasta with penne in a light creamy tomato sauce, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "beef-ramen-noodles" "Professional food photography of beef ramen with thin sliced steak, soft-boiled egg, pak choi in rich broth, warm lighting, 45 degree angle, photorealistic, no text no watermarks"
generate "homemade-beef-crunch-wraps" "Professional food photography of a golden crunchy beef wrap cut in half showing layers of meat, cheese, sour cream, warm lighting, side angle, photorealistic, no text no watermarks"
generate "meatball-chilli-con-carne" "Professional food photography of meatballs in a rich spicy chilli sauce with kidney beans, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "spicy-korean-beef-wraps" "Professional food photography of Korean beef wraps with gochujang marinated beef, rice, pickled vegetables, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "homemade-smash-burgers" "Professional food photography of a double smash burger with melted American cheese, pickles, sauce on a brioche bun, warm lighting, side angle, photorealistic, no text no watermarks"
generate "sweet-potato-chorizo-hash" "Professional food photography of a sweet potato hash with crispy chorizo and two fried eggs on top, in a cast iron skillet, warm lighting, overhead shot, photorealistic, no text no watermarks"

echo "[B2] DONE"; rm -rf "$WORKDIR"
