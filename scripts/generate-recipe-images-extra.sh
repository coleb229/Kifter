#!/bin/bash
# GEMINI_API_KEY must be set in environment before running
OUT="public/images/recipes"

generate() {
  local id="$1"
  local prompt="$2"
  if [ -f "$OUT/$id.png" ]; then echo "SKIP $id"; return; fi
  echo "GENERATING $id..."
  rm -f nanobanana-output/*.png
  gemini --yolo -p "/generate '$prompt'" 2>/dev/null
  local file=$(ls -t nanobanana-output/*.png 2>/dev/null | head -1)
  if [ -n "$file" ]; then cp "$file" "$OUT/$id.png"; echo "  OK"; else echo "  FAILED"; fi
}

generate "hp-breakfast-burrito" "Professional food photography of a large breakfast burrito cut in half showing scrambled eggs, turkey sausage, black beans, cheese, warm lighting, side angle, photorealistic, no text no watermarks"
generate "cheeseburger-omelette" "Professional food photography of a cheeseburger-style omelette with ground beef, melted cheese, pickles, tomato, on a plate, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "ms-steak-grilled-cheese" "Professional food photography of a steak and pepper jack grilled cheese sandwich, golden toasted, melted cheese visible, warm lighting, side angle, photorealistic, no text no watermarks"
generate "ms-turkey-meatballs-peppers" "Professional food photography of turkey meatballs with green peppers in marinara sauce in a slow cooker, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "ms-chipotle-salmon" "Professional food photography of grilled chipotle salmon with mango salsa and black beans, warm lighting, overhead shot, photorealistic, no text no watermarks"
generate "ms-buffalo-chicken-sliders" "Professional food photography of buffalo chicken sliders with blue cheese on small buns, warm lighting, side angle, photorealistic, no text no watermarks"
generate "ms-meatball-sub" "Professional food photography of a cheesy meatball sub sandwich with melted mozzarella and marinara sauce, warm lighting, side angle, photorealistic, no text no watermarks"
generate "ms-chicken-parm-meatloaf" "Professional food photography of a sliced chicken parmesan meatloaf topped with marinara and melted mozzarella, warm lighting, 45 degree angle, photorealistic, no text no watermarks"
generate "lean-beef-enchiladas" "Professional food photography of beef enchiladas in a baking dish with melted cheese, red enchilada sauce, warm lighting, overhead shot, photorealistic, no text no watermarks"

echo "EXTRA BATCH DONE"
