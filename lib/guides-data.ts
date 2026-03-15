export type GuideDifficulty = "beginner" | "intermediate" | "advanced";
export type GuideCategory =
  | "beginner"
  | "strength"
  | "hypertrophy"
  | "nutrition"
  | "recovery"
  | "compound";

export interface GuideSection {
  heading: string;
  body: string;
}

export interface Guide {
  slug: string;
  title: string;
  description: string;
  category: GuideCategory;
  difficulty: GuideDifficulty;
  readingTime: number;
  featured?: boolean;
  tags: string[];
  sections: GuideSection[];
}

export const allGuides: Guide[] = [
  // ── Beginner ──────────────────────────────────────────────────────────────
  {
    slug: "how-to-warm-up",
    title: "How to Warm Up Properly",
    description:
      "A good warm-up primes your muscles, elevates your heart rate, and reduces injury risk. Learn a repeatable routine you can use before any session.",
    category: "beginner",
    difficulty: "beginner",
    readingTime: 5,
    tags: ["warm-up", "mobility", "injury prevention", "routine"],
    sections: [
      {
        heading: "Why Warming Up Matters",
        body: "Jumping straight into heavy sets when your muscles are cold is one of the most common ways beginners get injured. A proper warm-up increases blood flow to your working muscles, raises core body temperature, and improves joint lubrication — all of which translate into better performance and fewer tweaks.",
      },
      {
        heading: "The 3-Part Framework",
        body: "Start with 3–5 minutes of light cardio (bike, treadmill, or brisk walk) to raise your heart rate. Follow with 5 minutes of dynamic stretching — leg swings, arm circles, hip rotations, and thoracic rotations. Finally, perform 2–3 progressively heavier warm-up sets of your first exercise before touching your working weight.",
      },
      {
        heading: "Sample Warm-Up Sequence (Push Day)",
        body: "3 min light bike → 10 arm circles each direction → 10 shoulder pass-throughs with a band → 10 chest-opening rotations → Bench Press: bar × 10, 95 lb × 8, 135 lb × 5 → start working sets. The whole sequence takes under 10 minutes and makes a measurable difference in how your body feels during the session.",
      },
      {
        heading: "What to Skip",
        body: "Avoid static stretches (holding a stretch for 30+ seconds) before lifting — research shows this can temporarily reduce strength output. Save long static holds for your cool-down or rest days. Also skip the 20-minute treadmill jog unless you're training for cardio; excessive pre-fatigue will compromise your lifts.",
      },
    ],
  },
  {
    slug: "sets-reps-rest",
    title: "Understanding Sets, Reps & Rest",
    description:
      "These three variables control almost everything about your training outcome. Master them and you'll program your workouts like a pro.",
    category: "beginner",
    difficulty: "beginner",
    readingTime: 6,
    tags: ["programming", "sets", "reps", "rest periods", "fundamentals"],
    sections: [
      {
        heading: "Defining the Terms",
        body: "A rep (repetition) is a single complete movement — one squat down and back up is one rep. A set is a group of consecutive reps performed without resting — '3 sets of 10' means you do 10 reps, rest, 10 reps, rest, then 10 reps. Rest is the time you take between sets to recover before the next one.",
      },
      {
        heading: "Rep Ranges & Their Goals",
        body: "1–5 reps at high weight builds maximal strength and nervous-system efficiency. 6–12 reps at moderate weight is the classic hypertrophy (muscle-building) range. 13–20+ reps at lighter weight emphasizes muscular endurance and metabolic stress. Most programs blend these ranges — don't feel locked into just one.",
      },
      {
        heading: "How Much Rest Do You Need?",
        body: "Strength work (1–5 reps) needs 3–5 minutes to fully replenish your ATP stores. Hypertrophy work (6–12 reps) typically calls for 60–120 seconds. Endurance sets can use 30–60 seconds. Cutting your rest periods short is one of the most common mistakes — you end up lifting less weight and limiting your progress.",
      },
      {
        heading: "Putting It Together",
        body: "A simple beginner template: 3 exercises per session, 3 sets of 8–10 reps each, 90 seconds rest between sets. This hits all the major adaptations and leaves room to add weight each week. Once that stops feeling challenging, you're ready to periodize.",
      },
    ],
  },
  {
    slug: "gym-etiquette-101",
    title: "Gym Etiquette 101",
    description:
      "New to the gym? These unwritten rules will help you fit in, stay safe, and make friends instead of enemies on the floor.",
    category: "beginner",
    difficulty: "beginner",
    readingTime: 4,
    tags: ["etiquette", "beginner", "gym culture", "safety"],
    sections: [
      {
        heading: "Re-Rack Your Weights",
        body: "The cardinal rule of every gym: put weights back where you found them. That means reracking dumbbells in order, stripping barbells after your set, and returning plates to the correct peg. Nobody wants to hunt for the 45s because someone left them on a random bar across the room.",
      },
      {
        heading: "Wipe Down Equipment",
        body: "Bring a small towel or use the gym's disinfectant spray on machines, benches, and handles after you use them. It's a basic courtesy that keeps everyone healthy. Most gyms provide wipes or spray bottles near the entrance — use them.",
      },
      {
        heading: "Share and Communicate",
        body: "If someone wants to work in (share your equipment between sets), say yes when you can — it's the norm. Ask 'Are you done with this?' before taking equipment someone is near. Avoid hoarding multiple pieces of equipment during busy hours.",
      },
      {
        heading: "Phone & Headphone Etiquette",
        body: "Headphones are universal 'I'm focused, don't disturb me' signals — respect them unless it's urgent. Keep your music out of the speakers (headphones only). Avoid long phone calls on the gym floor, and don't take photos that include other people without their knowledge.",
      },
    ],
  },

  {
    slug: "your-first-week",
    title: "Your First Week at the Gym",
    description:
      "The first week is the hardest — not physically, but mentally. Here's exactly what to expect, how to navigate it, and why almost everyone feels the same way you do.",
    category: "beginner",
    difficulty: "beginner",
    readingTime: 6,
    tags: ["beginner", "first week", "gym anxiety", "getting started"],
    sections: [
      {
        heading: "Everyone Feels Like an Imposter at First",
        body: "The overwhelming majority of gym-goers remember feeling lost, self-conscious, and out of place during their first few sessions. The people who look confident have simply been coming long enough that the environment feels normal. Nobody is watching you as closely as you think — they're focused on their own training. Give yourself permission to be a beginner.",
      },
      {
        heading: "Day 1: Orientation, Not Performance",
        body: "Your only goal on day one is to learn where things are and do something. Find the dumbbells, the cardio machines, the bathrooms. Do 20–30 minutes of light activity — a bike, a few dumbbell exercises you know, some bodyweight movements. Don't worry about the 'right' program. Just move and leave feeling like you accomplished something.",
      },
      {
        heading: "Expect to Be Sore",
        body: "Delayed-onset muscle soreness (DOMS) peaks 24–48 hours after your first sessions. This is normal and temporary — it's your muscles adapting to new stress. It does NOT mean you injured yourself. It also doesn't mean soreness equals a good workout; after a few weeks, you'll barely be sore even after hard sessions. Don't let early soreness become a reason to stay home.",
      },
      {
        heading: "Building the Habit",
        body: "For your first two weeks, consistency matters infinitely more than intensity. Three sessions of 30–40 minutes is far better than one heroic two-hour session that leaves you too sore and burnt out to return. Pick three days that work with your schedule and protect them like appointments. The gym becomes easy once it's simply a part of your routine.",
      },
    ],
  },
  {
    slug: "choosing-your-first-program",
    title: "How to Choose Your First Training Program",
    description:
      "There are thousands of programs online and each one claims to be the best. Here's the honest framework for choosing one that will actually work for you.",
    category: "beginner",
    difficulty: "beginner",
    readingTime: 5,
    tags: ["programming", "beginner", "getting started", "routine"],
    sections: [
      {
        heading: "The Best Program Is the One You'll Stick To",
        body: "Beginners often spend weeks comparing programs — StrongLifts 5×5 vs. Starting Strength vs. GZCLP vs. Reddit's PPL — before making a choice. Here's the truth: virtually any structured beginner program will produce excellent results if you follow it consistently. The difference between programs is tiny compared to the difference between doing something versus nothing.",
      },
      {
        heading: "Key Criteria for Beginners",
        body: "A good beginner program includes: 3 full-body sessions per week (ample recovery for adapting muscles), compound movements as the foundation (squat, hinge, push, pull), simple linear progression (add weight regularly), and a clear structure (no need to invent workouts). Avoid programs built around isolation exercises, excessive volume, or complicated periodization — those are tools for intermediates and advanced lifters.",
      },
      {
        heading: "Simple Starter Template",
        body: "If you can't decide: Day A — Squat 3×5, Bench Press 3×5, Barbell Row 3×5. Day B — Squat 3×5, Overhead Press 3×5, Deadlift 1×5. Alternate A and B each session, add 5 lb to upper body lifts and 10 lb to lower body lifts each session. This is essentially StrongLifts 5×5 — it works, it's simple, and it's been proven on hundreds of thousands of beginners.",
      },
      {
        heading: "When to Change Programs",
        body: "Stick with your first program until you've run it for 3–4 months or until you stall consistently on all major lifts despite deloading. Beginners who program-hop every few weeks never allow the adaptation to compound. The boredom you feel at week 6 is not a signal to switch — it's a signal that the program is working and your body is adapting.",
      },
    ],
  },
  {
    slug: "tracking-progress",
    title: "Tracking Progress Beyond the Scale",
    description:
      "Body weight is the least informative measure of fitness progress. Here are five better metrics — and how to use them to stay motivated when the scale doesn't move.",
    category: "beginner",
    difficulty: "beginner",
    readingTime: 5,
    tags: ["progress", "tracking", "motivation", "body composition"],
    sections: [
      {
        heading: "Why the Scale Lies",
        body: "Body weight can swing 3–5 lb in a single day based on water retention, food volume, sodium intake, and hormonal fluctuations. A person who gains 3 lb of muscle and loses 3 lb of fat in a month will look dramatically different in the mirror but show zero change on the scale. Relying on the scale alone as a measure of progress is a reliable way to feel like your training isn't working when it absolutely is.",
      },
      {
        heading: "Strength Metrics",
        body: "Tracking the weight you lift on key exercises is one of the most objective measures of progress available. If you squatted 95 lb for 3×5 in January and you're now squatting 185 lb for 3×5 in June, something real has changed in your body — regardless of what the scale says. Kifted's analytics page tracks your max weight per exercise over time, making it easy to see the arc of your progress.",
      },
      {
        heading: "Body Measurements",
        body: "A tape measure tells a story the scale can't. Measure your chest, waist, hips, upper arm, and upper thigh once every 4 weeks (same time of day, same conditions). A shrinking waist with a growing chest and arms is exactly what body recomposition looks like — and no scale will show you that. Photographs every 4–6 weeks are even more revealing.",
      },
      {
        heading: "Performance and Feel",
        body: "Can you run up stairs without getting winded? Do clothes that used to be tight now fit better? Are you sleeping more soundly? Recovering faster between sets? These qualitative signals are real progress even when the mirror hasn't caught up yet. The most durable motivation comes from noticing that your body works better — not just looks different.",
      },
    ],
  },

  // ── Strength ──────────────────────────────────────────────────────────────
  {
    slug: "bench-press-form",
    title: "The Bench Press: Form & Progression",
    description:
      "The bench press is one of the most iconic lifts — and one of the most commonly done wrong. Here's how to build a strong, safe press.",
    category: "strength",
    difficulty: "beginner",
    readingTime: 7,
    tags: ["bench press", "chest", "pushing", "form", "strength"],
    sections: [
      {
        heading: "Setting Up for Success",
        body: "Lie on the bench with your eyes directly under the bar. Plant your feet flat on the floor or on the bench (if you're shorter). Grip the bar just outside shoulder width — your forearms should be vertical at the bottom of the lift when viewed from the side. Squeeze your shoulder blades together and slightly arch your lower back, creating a stable base.",
      },
      {
        heading: "The Descent",
        body: "Unrack the bar and hold it directly above your chest with locked-out arms. Lower it in a slight diagonal path — to your lower chest/upper sternum area — keeping your elbows at roughly 45–75° from your torso. Don't flare elbows straight out (shoulder killer) or tuck them too narrow (reduces pec recruitment). Touch your chest lightly; don't bounce the weight.",
      },
      {
        heading: "Driving the Bar Up",
        body: "Press the bar back up and slightly toward the rack (leg-drive assists here). Think 'push yourself into the bench' rather than 'push the bar away from you.' Lockout fully at the top. Breathe: inhale before descending, hold during the rep (Valsalva), exhale at or after lockout.",
      },
      {
        heading: "Adding Weight Over Time",
        body: "Linear progression works great for beginners: add 5 lb per session until you stall, then switch to weekly progression. Track your lifts in Kifted — if you can see 3 sessions in a row at the same weight, it's time to deload by 10% and build back up with better technique.",
      },
    ],
  },
  {
    slug: "mastering-the-squat",
    title: "Mastering the Squat",
    description:
      "The squat is king of lower-body exercises. Learn the mechanics, cues, and common errors to build legs that actually grow.",
    category: "strength",
    difficulty: "beginner",
    readingTime: 8,
    tags: ["squat", "legs", "quads", "form", "strength", "glutes"],
    sections: [
      {
        heading: "Bar Position & Stance",
        body: "High-bar squats sit the bar on your traps and reward an upright torso — great for quads and general fitness. Low-bar squats sit the bar across your rear delts and allow more hip hinge, leading to more weight moved — popular in powerlifting. Start with high-bar to learn the movement pattern. Feet shoulder-width apart, toes pointed 15–30° outward.",
      },
      {
        heading: "The Descent",
        body: "Take a big breath, brace your core as if you're about to be punched, and initiate the squat by pushing your knees out over your toes while sitting your hips back and down. Keep your chest tall. Aim to squat until your hip crease passes below your knee ('below parallel'). Heels must stay flat on the floor throughout.",
      },
      {
        heading: "Common Errors",
        body: "Knee cave (knees collapsing inward) usually indicates weak glutes or adductors — cue 'push knees out' and add band walks. Butt wink (pelvis tucking under at the bottom) often comes from limited ankle mobility — try heel elevation or ankle stretches. Chest falling forward suggests the weight is too heavy or the core is too weak for that depth.",
      },
      {
        heading: "Progression Strategy",
        body: "Goblet squats are the best starting point — the counterbalance teaches you to keep your torso upright naturally. Move to a barbell once you can goblet squat 50–60 lb with perfect form. Then run a linear progression, adding 5–10 lb per session until you reach a plateau.",
      },
    ],
  },
  {
    slug: "deadlift-fundamentals",
    title: "Deadlift Fundamentals",
    description:
      "Pull heavy things off the floor safely and effectively. The deadlift builds the entire posterior chain when done right — and wrecks your back when done wrong.",
    category: "strength",
    difficulty: "intermediate",
    readingTime: 7,
    tags: ["deadlift", "posterior chain", "back", "hamstrings", "form"],
    sections: [
      {
        heading: "The Setup",
        body: "Stand with the bar over your mid-foot (about 1 inch from your shins). Hinge at the hips and grab the bar just outside your legs — double overhand or mixed grip. Before lifting, take a deep breath, brace your abs hard, then drive your hips down until your shins touch the bar. Your shoulders should be over or slightly in front of the bar.",
      },
      {
        heading: "The Pull",
        body: "Think 'push the floor away' rather than 'pull the bar up' — this cue engages your legs instead of turning the lift into a back-dominant row. Keep the bar in contact with your body the entire way up (scrape your shins). Lock out by squeezing your glutes and standing tall — do not hyperextend your lower back at the top.",
      },
      {
        heading: "Conventional vs. Sumo",
        body: "Conventional deadlift has a shoulder-width stance with hands outside the legs — more lower back and hamstring dominant. Sumo deadlift has a wide stance with hands inside the legs — more quad and hip dominant, shorter range of motion. Neither is inherently better; pick the one that matches your anatomy and goals.",
      },
      {
        heading: "Protecting Your Back",
        body: "Never round your lower back under load (flexion under compression). A slight upper-back rounding is acceptable for advanced lifters, but lumbar rounding is asking for a herniation. If your lower back rounds, the weight is too heavy or your hip hinge pattern needs work. Romanian deadlifts and good mornings are excellent accessory movements to reinforce proper position.",
      },
    ],
  },

  {
    slug: "barbell-row",
    title: "The Barbell Row: Building a Thick Back",
    description:
      "The barbell row is the best mass-builder for the back that most lifters do wrong. Learn the setup, the pull, and why your grip matters more than you think.",
    category: "strength",
    difficulty: "beginner",
    readingTime: 6,
    tags: ["barbell row", "back", "lats", "rhomboids", "pulling"],
    sections: [
      {
        heading: "Setup and Hip Hinge",
        body: "Stand with the bar over your mid-foot. Hinge until your torso is roughly 45° from horizontal (or more parallel for a Pendlay-style row). Grip just outside shoulder width — overhand for upper back emphasis, underhand for more bicep and lower lat engagement. Pull your shoulder blades back slightly before each rep to engage the rhomboids from the start.",
      },
      {
        heading: "The Pull",
        body: "Drive your elbows back and up — think 'elbows to the ceiling, not to the walls.' Pull the bar to your lower sternum/upper abdomen, not your chest. At the top, actively squeeze your shoulder blades together for a full contraction. Lower the bar under control rather than dropping it — the eccentric portion is where significant muscle damage and growth stimulus occur.",
      },
      {
        heading: "Common Errors",
        body: "The biggest mistake in barbell rows is using too much body English — jerking the torso upright to swing the weight up. This takes load off the lats and puts it on your lower back. If you're bouncing, reduce the weight. Second most common: not pulling the elbows far enough back, which keeps the muscles in a shortened position and reduces the effective range of motion.",
      },
      {
        heading: "Pendlay vs. Bent-Over Row",
        body: "Pendlay rows start each rep from a dead stop on the floor (torso parallel, strict), making them more explosive and demanding. Bent-over rows maintain a hinge position throughout and allow the bar to move within a range. Pendlay rows are better for raw back strength and power; bent-over rows allow more volume with slightly less spinal loading. Both belong in a well-rounded back program.",
      },
    ],
  },
  {
    slug: "periodization-101",
    title: "Periodization 101: Peaks and Valleys",
    description:
      "Random training produces random results. Periodization is the principle of structuring your training over time to maximize both performance and recovery — and it's how every serious athlete programs.",
    category: "strength",
    difficulty: "intermediate",
    readingTime: 7,
    tags: ["periodization", "programming", "strength", "peaking", "planning"],
    sections: [
      {
        heading: "What Periodization Means",
        body: "Periodization simply means organizing your training into phases with distinct goals. Instead of doing the same weight and rep scheme week after week, you deliberately vary the training stimulus across time. This prevents accommodation (the body's tendency to stop adapting to the same stress), manages fatigue, and allows you to peak strength at specific times.",
      },
      {
        heading: "Linear Periodization",
        body: "The simplest form: start with higher reps and lower weight, then progressively add weight and reduce reps over weeks or months. Example: Weeks 1–4 at 4×10, Weeks 5–8 at 4×6, Weeks 9–12 at 4×3, Week 13 — test your max. This structure works extremely well for intermediate lifters who've exhausted simple session-to-session progression.",
      },
      {
        heading: "Undulating Periodization",
        body: "Daily undulating periodization (DUP) varies the stimulus within each week — for example, Monday is strength day (4×4), Wednesday is hypertrophy day (4×10), Friday is power day (5×3 at 70%). This keeps the body from adapting to any single stimulus and is well-supported by research for both strength and muscle growth. It requires more planning but produces excellent results.",
      },
      {
        heading: "The Deload as a Periodization Tool",
        body: "No periodization plan works without planned recovery phases. After every 4–8 week accumulation block, include a deload week at 40–60% of normal volume. This allows supercompensation — the body rebuilds stronger than before the block. Many lifters skip deloads and plateau; those who program them consistently hit new PRs after each recovery week.",
      },
    ],
  },
  {
    slug: "grip-strength",
    title: "Grip Strength: The Hidden Performance Limiter",
    description:
      "Your grip is the weakest link in most pulling movements. Strengthening it unlocks heavier deadlifts, rows, and pull-ups — and reduces your risk of dropping things in the worst moments.",
    category: "strength",
    difficulty: "beginner",
    readingTime: 5,
    tags: ["grip strength", "deadlift", "pull-ups", "accessory", "hands"],
    sections: [
      {
        heading: "Why Grip Fails Before Muscles",
        body: "Your forearm flexors and grip muscles are used constantly in daily life but almost never trained directly. When you pull heavy, they fatigue long before your lats or hamstrings do. Using straps masks the problem rather than fixing it — and there are contexts (competitions, functional strength, unexpected situations) where straps won't be available. A stronger grip raises the ceiling on every pulling exercise.",
      },
      {
        heading: "The Best Grip Training Exercises",
        body: "Dead hangs (hang from the pull-up bar as long as possible) are simple and brutally effective. Farmer's carries — grab two heavy dumbbells and walk — build crushing grip and forearm endurance simultaneously. Plate pinches (pinch two 10-lb plates together with your fingers and hold them at your side) target the often-neglected pinch strength. All three can be done at the end of any session in 5–10 minutes.",
      },
      {
        heading: "Double Overhand vs. Mixed Grip vs. Hook Grip",
        body: "Double overhand is the hardest grip to hold but trains grip most directly. Mixed grip (one hand over, one under) dramatically increases the weight you can hold but creates rotational imbalance — use it for top sets only. Hook grip (thumbs under fingers) is used in Olympic lifting and powerlifting — uncomfortable initially but extremely secure once practiced. Develop double overhand strength first; mixed and hook grip are tools for when the weight demands them.",
      },
      {
        heading: "A Simple Add-On Protocol",
        body: "After your last deadlift or row set, add: 2–3 sets of dead hangs to near-failure (rest 90 seconds between), plus one 60-second farmer's carry at bodyweight total (two dumbbells, each 50% of your bodyweight). Do this twice a week. Within 6–8 weeks, you'll notice deadlift lockout feeling more secure and pull-up reps increasing — because the limiting factor is no longer your hands.",
      },
    ],
  },

  // ── Hypertrophy ───────────────────────────────────────────────────────────
  {
    slug: "progressive-overload",
    title: "Progressive Overload Explained",
    description:
      "The single most important principle in all of training. If you're not doing this, your body has no reason to change.",
    category: "hypertrophy",
    difficulty: "beginner",
    readingTime: 5,
    featured: true,
    tags: ["progressive overload", "muscle growth", "fundamentals", "strength"],
    sections: [
      {
        heading: "What Is Progressive Overload?",
        body: "Progressive overload means consistently increasing the demand on your muscles over time. Your body adapts to the stress you give it — once it adapts, that stress no longer triggers new growth. To keep progressing, you must keep giving your body a new challenge. This is the bedrock of every successful training program.",
      },
      {
        heading: "Ways to Apply It",
        body: "Adding weight is the most common method — if you benched 135 lb for 3×8 last week, try 140 lb this week. But weight isn't the only lever: you can add reps (135 lb for 3×9 instead of 3×8), add sets, reduce rest periods, improve range of motion, or slow the tempo to increase time under tension. All of these count as overload.",
      },
      {
        heading: "How to Track It",
        body: "You cannot progressively overload what you don't track. Log every session — exercise, weight, sets, reps — so you can see your history. Kifted's analytics page shows your weight progression over time for each exercise, making it easy to spot when you've stalled and need to change your approach.",
      },
      {
        heading: "The Long Game",
        body: "Beginners can add weight nearly every session. Intermediate lifters typically progress weekly. Advanced athletes might progress monthly or even less frequently. This isn't failure — it's just how adaptation works. The goal is to still be stronger and more muscular in a year than you are today.",
      },
    ],
  },
  {
    slug: "building-a-ppl-split",
    title: "Building a PPL Split",
    description:
      "Push-Pull-Legs is one of the most efficient and popular training splits. Learn how to structure your week for maximum muscle and minimum overlap.",
    category: "hypertrophy",
    difficulty: "intermediate",
    readingTime: 7,
    tags: ["PPL", "split", "programming", "hypertrophy", "weekly structure"],
    sections: [
      {
        heading: "What Is Push/Pull/Legs?",
        body: "PPL divides your training into three days by movement pattern. Push day targets chest, shoulders, and triceps (pressing movements). Pull day targets back and biceps (pulling movements). Legs day targets quads, hamstrings, glutes, and calves. Run it 3 days/week for beginners, 6 days/week (two full rotations) for more advanced trainees.",
      },
      {
        heading: "Sample Push Day",
        body: "Bench Press 4×6–8, Overhead Press 3×8–10, Incline Dumbbell Press 3×10–12, Lateral Raises 4×15–20, Tricep Rope Pushdown 3×12–15, Overhead Tricep Extension 3×12–15. Prioritize compound movements first when you're fresh, then accessories to finish off the muscles.",
      },
      {
        heading: "Sample Pull Day",
        body: "Barbell Row 4×6–8, Pull-Ups or Lat Pulldown 4×8–10, Cable Row 3×10–12, Face Pulls 4×15–20, Barbell or Dumbbell Curl 3×10–12, Hammer Curl 3×12–15. Pull days are where most people undertraining their back — aim for at least as much pull volume as push volume.",
      },
      {
        heading: "Recovery Considerations",
        body: "On a 6-day PPL, you have one rest day — place it wherever you need it most (typically after the second legs day). Make sure you're eating and sleeping enough to support this frequency. If you're consistently feeling beat up, drop to a 3-day rotation with more rest between sessions.",
      },
    ],
  },
  {
    slug: "mind-muscle-connection",
    title: "Mind-Muscle Connection",
    description:
      "Research shows that actively focusing on the muscle you're training can increase activation by up to 22%. Here's how to develop this skill.",
    category: "hypertrophy",
    difficulty: "intermediate",
    readingTime: 5,
    tags: ["mind-muscle", "activation", "technique", "hypertrophy"],
    sections: [
      {
        heading: "The Science Behind It",
        body: "A 2018 study published in the European Journal of Sport Science found that consciously focusing on the target muscle during an exercise significantly increases EMG activation compared to focusing on the movement or outcome. This effect is strongest on isolation exercises and at moderate rep ranges (8–15 reps).",
      },
      {
        heading: "How to Practice",
        body: "Start with light weights — 30–40% of your max. Perform the movement slowly and deliberately, squeezing the target muscle at full contraction. For example, during a dumbbell curl, focus on the sensation in your bicep throughout the lift, especially at the peak. If you can't feel the muscle working, you're either too heavy or the technique is off.",
      },
      {
        heading: "Activation Exercises",
        body: "Before your main sets, add targeted activation work. Glute bridges before squats, band pull-aparts before rows, cable flyes before bench press. These prime the neuromuscular connection so the target muscle fires first when you load the movement.",
      },
      {
        heading: "When It Matters Most",
        body: "Mind-muscle connection has the biggest payoff on isolation and machine exercises. On heavy compound movements like deadlifts and squats, focusing on technique cues ('brace, push the floor away') tends to outperform internal muscle focus. Use the right tool for the right job.",
      },
    ],
  },

  {
    slug: "training-to-failure",
    title: "Training to Failure: When It Helps and When It Hurts",
    description:
      "The 'no pain, no gain' maxim has convinced generations of lifters to grind every set to absolute failure. The research tells a more nuanced story.",
    category: "hypertrophy",
    difficulty: "intermediate",
    readingTime: 6,
    tags: ["training to failure", "intensity", "hypertrophy", "volume", "recovery"],
    sections: [
      {
        heading: "What Failure Actually Means",
        body: "Technical failure is the point at which you can no longer complete a rep with good form. True muscular failure is when the muscle literally cannot produce another contraction regardless of technique. Most productive training should stop before technical failure — not because pushing hard isn't valuable, but because form breakdown shifts load to secondary muscles and joints, not to the target muscle.",
      },
      {
        heading: "The Research on Proximity to Failure",
        body: "A significant body of research (Schoenfeld, Krieger, Brad Borge) suggests that leaving 1–3 reps in reserve (RIR) produces nearly identical hypertrophy to training to absolute failure — with substantially less accumulated fatigue. Failure training is most productive on isolation exercises at the end of a session, where fatigue won't compound across subsequent exercises.",
      },
      {
        heading: "Where Failure Training Belongs",
        body: "Best used: isolation exercises (curls, lateral raises, cable flyes) on the final set of a muscle group. Avoid on: compound movements early in a session (squat, deadlift, bench), any overhead movements, and exercises where failure creates a safety risk. A useful rule: the more joints involved and the heavier the load, the further from failure you should train.",
      },
      {
        heading: "The Fatigue Cost",
        body: "Each set taken to failure accumulates roughly 3–4x the systemic fatigue of a set stopped 3 reps short, with similar hypertrophy stimulus. This means failure training shrinks the total productive volume you can do in a session and a week. High-frequency programs (hitting each muscle 2–3x/week) benefit most from staying away from failure — the lower per-session fatigue lets you return sooner with quality effort.",
      },
    ],
  },
  {
    slug: "volume-vs-intensity",
    title: "Volume vs. Intensity: Finding Your Sweet Spot",
    description:
      "Two lifters can train 5 days a week and get completely different results based on how they manage these two variables. Understanding the relationship between them is the key to smarter programming.",
    category: "hypertrophy",
    difficulty: "intermediate",
    readingTime: 6,
    tags: ["volume", "intensity", "programming", "hypertrophy", "periodization"],
    sections: [
      {
        heading: "Defining the Terms",
        body: "Volume in resistance training is typically measured as sets × reps × weight (tonnage), or simply the total number of hard sets per muscle group per week. Intensity has two meanings: the subjective effort level, and the objective load relative to your maximum (% of 1RM). For hypertrophy programming, volume is the primary driver — intensity determines the rep range you work in.",
      },
      {
        heading: "How Much Volume Is Enough?",
        body: "The research suggests 10–20 hard sets per muscle group per week is the effective range for most intermediate lifters. Below 10 sets, you're likely leaving gains on the table. Above 20 hard sets, most people accumulate fatigue faster than they can recover, leading to diminishing returns and overuse injuries. Beginners need less — 6–10 sets per muscle is plenty. Advanced lifters may tolerate up to 25 sets with superior recovery habits.",
      },
      {
        heading: "Intensity's Role",
        body: "For hypertrophy, the research supports a surprisingly wide intensity range: roughly 30–85% of 1RM produces similar muscle growth if sets are taken close to failure. This means both high-rep pump sets (15–20 reps) and lower-rep strength sets (6–8 reps) are viable hypertrophy tools. The practical takeaway: don't avoid lower reps out of fear they're 'only for strength' — compound lifts in the 5–8 rep range build significant muscle mass.",
      },
      {
        heading: "The Inverse Relationship",
        body: "Volume and intensity have an inverse relationship within a given period: you can push the volume high or the intensity high, but doing both simultaneously leads to overtraining. This is why peaking phases (high intensity, low volume) and accumulation phases (moderate intensity, high volume) alternate in well-designed programs. During a high-volume phase, work at moderate intensities (60–75% 1RM). During a strength phase, reduce total sets but increase load.",
      },
    ],
  },
  {
    slug: "isolation-exercises",
    title: "Isolation Exercises: The Case for Curls",
    description:
      "The strength community spent a decade telling everyone to skip isolation work. They were wrong. Here's why curls, flyes, and lateral raises deserve a place in your program.",
    category: "hypertrophy",
    difficulty: "beginner",
    readingTime: 5,
    tags: ["isolation", "curls", "hypertrophy", "arms", "accessories"],
    sections: [
      {
        heading: "What Compounds Can't Do",
        body: "Compound movements are the most efficient tools for building total strength and muscle mass — but they don't train every muscle equally. Biceps are involved in rows and pull-ups but never truly isolated or fully stretched. Lateral deltoids get minimal stimulus from pressing. Long head triceps aren't fully stretched in pushdowns. These gaps in compound training are exactly what isolation exercises fill.",
      },
      {
        heading: "The Stretch-Mediated Hypertrophy Advantage",
        body: "Recent research has highlighted stretch-mediated hypertrophy — the idea that exercises that train a muscle in its fully lengthened position produce superior hypertrophy. This means incline dumbbell curls (stretching the bicep at the bottom) outperform standing curls for bicep growth. Similarly, overhead tricep extensions (stretching the long head) produce more tricep growth than pushdowns. Choose the isolation exercises that take the target muscle to its greatest stretch.",
      },
      {
        heading: "Programming Isolation Work",
        body: "Isolation exercises work best as finishers — after compound work when the target muscle is already warm and partially fatigued. Aim for 2–3 isolation exercises per muscle group per week, 3–4 sets of 10–15 reps each, taken close to failure. The lower load means you can push intensity without the spinal loading or systemic fatigue that comes from heavy compound work.",
      },
      {
        heading: "The Arm Training Disconnect",
        body: "Many lifters who say 'my arms never grow' are the same lifters who train arms exclusively through compound movements. Biceps see modest direct stimulus in rows and pull-ups; they grow dramatically when given targeted curling work. If arm development is a priority, add 3–4 dedicated curl sets and 3–4 tricep extension sets per session, twice a week. Most people see visible arm growth within 6–8 weeks of consistent direct arm training.",
      },
    ],
  },

  // ── Nutrition ─────────────────────────────────────────────────────────────
  {
    slug: "protein-101",
    title: "Protein 101: How Much Do You Need?",
    description:
      "Protein is the building block of muscle. Getting the right amount is one of the highest-leverage nutrition decisions you can make.",
    category: "nutrition",
    difficulty: "beginner",
    readingTime: 5,
    tags: ["protein", "nutrition", "muscle building", "macros"],
    sections: [
      {
        heading: "Why Protein Is Non-Negotiable",
        body: "When you lift weights, you create micro-tears in your muscle fibers. Protein provides the amino acids your body uses to repair and grow those fibers larger and stronger. Without enough protein, even the best training program will fail to produce meaningful muscle growth.",
      },
      {
        heading: "The Research-Backed Target",
        body: "A 2017 meta-analysis in the British Journal of Sports Medicine found that 0.7–1.0 g of protein per pound of bodyweight (1.6–2.2 g/kg) maximizes muscle protein synthesis. For a 180 lb person that's 126–180 g of protein per day. If you're cutting calories or above 30% body fat, aim for the higher end to preserve muscle.",
      },
      {
        heading: "Best Sources",
        body: "Lean meats (chicken breast, turkey, lean beef), fish (salmon, tuna, tilapia), eggs and egg whites, Greek yogurt, cottage cheese, and protein shakes are the most efficient sources. Whole food sources are generally preferred for satiety and micronutrient content, but protein shakes are a convenient complement — not a replacement.",
      },
      {
        heading: "Distribution Matters",
        body: "Spreading protein across 3–5 meals of 30–50g each is superior to eating it all in one or two sittings. Each meal triggers a muscle protein synthesis response that lasts roughly 3–5 hours. Consistent distribution keeps your body in an anabolic state throughout the day.",
      },
    ],
  },
  {
    slug: "pre-post-workout-nutrition",
    title: "Pre & Post Workout Nutrition",
    description:
      "What you eat around your workouts can meaningfully affect your performance and recovery. Here's what actually matters — and what's just marketing.",
    category: "nutrition",
    difficulty: "beginner",
    readingTime: 6,
    tags: ["pre-workout", "post-workout", "nutrition", "performance", "recovery"],
    sections: [
      {
        heading: "Pre-Workout: Fuel the Session",
        body: "Aim to eat a balanced meal 1–3 hours before training — protein (30–40g) plus carbohydrates (40–60g) works well for most people. The carbs top off your muscle glycogen for energy; the protein starts muscle protein synthesis. Good examples: chicken and rice, Greek yogurt with oats, or a turkey sandwich. If training first thing in the morning, a smaller snack (banana + protein shake) 30–45 minutes out is fine.",
      },
      {
        heading: "Hydration Before Training",
        body: "Even mild dehydration (2% of body weight) reduces strength output and cognitive function. Drink 16–20 oz of water in the 2 hours before your session. During training, sip 6–8 oz every 15–20 minutes. Sports drinks are unnecessary unless you're training for more than 90 minutes at high intensity.",
      },
      {
        heading: "Post-Workout: The Recovery Window",
        body: "The 'anabolic window' (the idea that you must eat within 30 minutes of finishing) is largely a myth for people eating regular meals. However, if you trained fasted or it's been more than 4–5 hours since your last protein-containing meal, a post-workout shake or meal becomes more important. Aim for 30–50g protein and 50–100g carbs within 2 hours of training.",
      },
      {
        heading: "What Actually Doesn't Matter",
        body: "Expensive pre-workout supps (mostly caffeine and placebo), BCAAs if you're already hitting protein targets, 'anabolic windows' when overall daily nutrition is solid, or eating the 'perfect' meal every time. Total daily protein, carbohydrate, and calorie intake across the whole day matters far more than the exact timing of any single meal.",
      },
    ],
  },
  {
    slug: "tracking-macros",
    title: "Tracking Macros for Muscle Gain",
    description:
      "Learning to track your macros is a superpower for body composition. Here's a practical system that doesn't consume your life.",
    category: "nutrition",
    difficulty: "intermediate",
    readingTime: 7,
    tags: ["macros", "tracking", "nutrition", "muscle gain", "calories"],
    sections: [
      {
        heading: "What Are Macros?",
        body: "Macronutrients are the three major categories of food that provide calories: protein (4 cal/g), carbohydrates (4 cal/g), and fat (9 cal/g). Tracking macros means hitting specific gram targets for each — rather than just counting total calories. This gives you control over body composition (muscle gain vs. fat gain vs. fat loss) rather than just body weight.",
      },
      {
        heading: "Setting Your Targets for Muscle Gain",
        body: "Start with total calories: multiply your bodyweight in pounds by 16–18 for a moderate lean bulk. Set protein at 0.8–1.0 g per pound of bodyweight. Set fat at 0.3–0.5 g per pound. Fill remaining calories with carbohydrates. Example for a 180 lb person: 2,880–3,240 calories, 144–180g protein, 54–90g fat, ~320–380g carbs.",
      },
      {
        heading: "Practical Tracking Tips",
        body: "Use a food scale for the first 2–4 weeks until you develop an intuitive sense of portions. Log everything — small bites and drinks add up quickly. Pre-log your day in the morning so you can adjust meals before eating them, rather than reacting after. You don't need perfect precision; ±10% on your targets is completely fine.",
      },
      {
        heading: "When to Adjust",
        body: "If you're gaining more than 0.75 lb/week consistently, reduce calories slightly. Gaining less than 0.25 lb/week? Add 100–200 calories. Weight fluctuates daily from water and food volume — use a 7-day rolling average to judge true trends. Reassess your calorie targets every 4–8 weeks as your bodyweight changes.",
      },
    ],
  },

  {
    slug: "bulk-cut-maintain",
    title: "Bulk, Cut, or Maintain: Eating for Your Goal",
    description:
      "Your caloric strategy should match your training goal. This guide explains the three approaches, who should use each, and how to transition between them without losing what you've built.",
    category: "nutrition",
    difficulty: "beginner",
    readingTime: 6,
    tags: ["bulk", "cut", "caloric surplus", "caloric deficit", "body composition"],
    sections: [
      {
        heading: "The Bulk: Building Muscle and Strength",
        body: "A caloric surplus (eating more than you burn) provides the raw materials for muscle growth. A 'clean bulk' or 'lean bulk' targets a surplus of 200–350 calories per day — enough to support muscle growth without excessive fat gain. At this rate, expect 0.25–0.5 lb of weight gain per week, with roughly half being muscle. Avoid 'dirty bulking' (eating everything in sight) — the fat gain outpaces the muscle gain and the subsequent cut erases the perceived progress.",
      },
      {
        heading: "The Cut: Losing Fat While Keeping Muscle",
        body: "A caloric deficit reduces stored body fat while ideally preserving muscle mass. Aim for a deficit of 300–500 calories per day — aggressive enough to see progress but conservative enough to prevent significant muscle loss. Key levers: keep protein high (1g/lb bodyweight), continue training hard (the muscle needs a reason to stay), and don't rush the timeline. A 1 lb/week fat loss rate is sustainable; 2 lb/week leads to muscle loss in most people.",
      },
      {
        heading: "Maintenance: The Underrated Phase",
        body: "Maintenance eating (calories in = calories out) is often dismissed as 'not making progress' — but it's a critical phase for consolidating gains, recovering from a cut, and allowing your metabolism to normalize. Many experienced lifters spend extended periods (4–8 weeks) at maintenance between bulk and cut phases. It also provides the baseline data you need to calculate your actual TDEE (total daily energy expenditure).",
      },
      {
        heading: "When to Switch Phases",
        body: "Start a cut when body fat is high enough to interfere with performance or recovery (roughly above 18–20% for men, 27–30% for women). Start a bulk when body fat is low enough that you can gain 4–8 months of muscle before needing to cut (roughly below 15% for men, 23% for women). These ranges are guidelines, not rules — the most important factor is how you feel, perform, and recover.",
      },
    ],
  },
  {
    slug: "creatine",
    title: "Creatine: The One Supplement That Actually Works",
    description:
      "In a sea of overhyped supplements backed by weak evidence, creatine stands apart. It has decades of research, zero serious side effects, and a meaningful impact on strength and muscle mass.",
    category: "nutrition",
    difficulty: "beginner",
    readingTime: 5,
    tags: ["creatine", "supplements", "performance", "muscle", "strength"],
    sections: [
      {
        heading: "What Creatine Does",
        body: "Creatine phosphate is a molecule your muscles use to rapidly regenerate ATP — the energy currency of short, high-intensity efforts. By saturating your muscles with more creatine than your diet provides, you extend the duration of maximum-effort output before fatigue sets in. In practical terms: you'll likely get 1–2 extra reps on your hardest sets. Compounded over months of training, this additional volume adds up to meaningfully more muscle.",
      },
      {
        heading: "The Evidence",
        body: "Creatine monohydrate is one of the most studied sports supplements in history, with over 500 peer-reviewed studies supporting its efficacy and safety. A 2012 meta-analysis found that creatine supplementation increased strength gains during resistance training by 8% and muscle mass by 14% compared to placebo. The International Society of Sports Nutrition considers it the most effective ergogenic nutritional supplement available for increasing high-intensity exercise capacity.",
      },
      {
        heading: "How to Take It",
        body: "3–5g of creatine monohydrate per day is the effective dose for most people. You can 'load' at 20g/day for 5–7 days to saturate your muscles faster, but it's not necessary — daily doses achieve the same saturation in 3–4 weeks. Take it any time of day; the timing matters far less than consistency. Creatine monohydrate powder is the cheapest form and works identically to more expensive 'enhanced' versions.",
      },
      {
        heading: "Addressing the Myths",
        body: "Creatine does not cause hair loss (the DHT study this claim comes from is a single, unreplicated 2009 study with methodological issues). Creatine does not damage kidneys in healthy people (multiple long-term studies confirm this). The initial 1–3 lb 'weight gain' is intracellular water — your muscles holding more water alongside the creatine. This is not fat gain; it actually increases cell volumization, which is a positive stimulus for muscle growth.",
      },
    ],
  },
  {
    slug: "meal-prep",
    title: "Meal Prep for Gym-Goers",
    description:
      "Nutrition is won or lost in the kitchen before you're hungry. Batch-cooking a few key foods on Sunday makes hitting your protein targets almost effortless for the rest of the week.",
    category: "nutrition",
    difficulty: "beginner",
    readingTime: 5,
    tags: ["meal prep", "nutrition", "protein", "cooking", "habits"],
    sections: [
      {
        heading: "Why Meal Prep Works",
        body: "When you're tired, busy, or hungry, willpower is your least reliable tool. The decision to eat a protein-rich meal versus grabbing whatever's fast happens in seconds. Meal prepping removes the decision entirely — your food is already made, portioned, and waiting. People who prep meals consistently hit their protein targets; people who rely on deciding each meal consistently fall short.",
      },
      {
        heading: "The Core Items to Prep",
        body: "Focus on three things: a protein source, a carbohydrate, and a vegetable. Protein: cook 3–4 lbs of chicken breast, ground turkey, or hard-boil a dozen eggs. Carbs: rice cooker makes 4–6 cups of rice automatically; roast a tray of potatoes or sweet potatoes. Vegetables: a sheet pan of broccoli, bell peppers, or zucchini at 400°F for 20 minutes. This takes about 45 minutes on Sunday and covers lunches and dinners for most of the week.",
      },
      {
        heading: "Flexible Prep vs. Full Portioning",
        body: "Some people do best pre-portioning every meal into containers (highest consistency, least flexibility). Others prefer prepping the components and assembling meals as needed (more variety, slightly more thought). For beginners, pre-portioned containers work best — there's no decision required. As you develop an intuitive sense of portion sizes, flexible prep lets you vary your meals more while maintaining accuracy.",
      },
      {
        heading: "Making It Sustainable",
        body: "Meal prep fails when the food is boring. Keep a rotation of 3–4 sauces and seasonings that transform the same ingredients into different-feeling meals: teriyaki chicken and rice, chicken and rice with salsa, chicken taco bowl, Greek chicken with tzatziki. The ingredients are identical; the experience is different. Also keep some protein-rich convenience items on hand (Greek yogurt, cottage cheese, protein bars) for days when prep runs out.",
      },
    ],
  },

  // ── Recovery ──────────────────────────────────────────────────────────────
  {
    slug: "sleep-and-muscle-recovery",
    title: "Sleep & Muscle Recovery",
    description:
      "You build muscle when you sleep, not when you train. Most gym-goers optimize everything except the most powerful recovery tool they have.",
    category: "recovery",
    difficulty: "beginner",
    readingTime: 5,
    tags: ["sleep", "recovery", "hormones", "muscle growth"],
    sections: [
      {
        heading: "What Happens While You Sleep",
        body: "During deep (slow-wave) sleep, your body releases the majority of its daily growth hormone — the primary driver of muscle repair and fat metabolism. Testosterone and IGF-1 also peak during sleep. Cut sleep short and you dramatically reduce the anabolic hormone output that makes your training productive.",
      },
      {
        heading: "How Much Is Enough?",
        body: "Most adults need 7–9 hours for full recovery. Athletes and those in heavy training phases may need closer to 9–10 hours. Studies show that sleeping less than 6 hours consistently leads to significant muscle loss even in a caloric surplus, and impairs reaction time, mood, and training intensity the next day.",
      },
      {
        heading: "Sleep Quality vs. Quantity",
        body: "Eight hours of fragmented, poor-quality sleep is not the same as eight hours of deep, uninterrupted sleep. Improve quality by keeping a consistent sleep schedule (even on weekends), making your room cold (65–68°F / 18–20°C) and completely dark, avoiding screens 30–60 minutes before bed, and limiting caffeine after 2 PM.",
      },
      {
        heading: "Training Too Late",
        body: "Vigorous exercise elevates core temperature and adrenaline — both interfere with sleep onset. Avoid intense training within 2–3 hours of bedtime if you have trouble falling asleep. Light stretching or a yoga session in the evening is fine and can actually improve sleep quality.",
      },
    ],
  },
  {
    slug: "stretching-vs-mobility",
    title: "Stretching vs. Mobility Work",
    description:
      "These terms are often used interchangeably but they're different tools with different goals. Know which one you actually need.",
    category: "recovery",
    difficulty: "beginner",
    readingTime: 5,
    tags: ["stretching", "mobility", "flexibility", "recovery", "warm-up"],
    sections: [
      {
        heading: "The Difference Defined",
        body: "Flexibility is the passive range of motion a muscle can achieve — how far it can be stretched. Mobility is the active, controlled range of motion you have at a joint — how far you can move through a range while maintaining tension and control. You can be flexible but immobile (a common issue for people who sit all day — their hips are loose but they lack control through range).",
      },
      {
        heading: "Static Stretching: When and How",
        body: "Hold a stretch for 30–60 seconds, breathing deeply. Best used post-workout, on rest days, or in dedicated flexibility sessions. Avoid before heavy lifting — static stretching has been shown to temporarily reduce force production by 5–8% in the immediately following sets. Targets: hip flexors, hamstrings, thoracic spine, pec minor.",
      },
      {
        heading: "Dynamic Mobility Work",
        body: "Controlled movement through range of motion — leg swings, hip circles, thoracic rotations, shoulder cars (controlled articular rotations). These are ideal before lifting as they raise tissue temperature while grooving movement patterns. 5–10 minutes of joint-specific mobility work before training pays dividends in movement quality and injury prevention.",
      },
      {
        heading: "A Simple Daily Routine",
        body: "Morning (5 min): 90/90 hip stretch, thoracic rotation, cat-cow. Pre-training (5 min): dynamic mobility relevant to that day's session. Post-training (5 min): static stretching for the muscles you just trained. Rest days: 15–20 min yoga or dedicated mobility session. Consistency matters more than duration — short daily practice beats a marathon session once a week.",
      },
    ],
  },
  {
    slug: "managing-fatigue",
    title: "Managing Fatigue & Avoiding Burnout",
    description:
      "Training hard is important, but training smart matters more. Learn how to read your body's signals and program recovery before you hit a wall.",
    category: "recovery",
    difficulty: "intermediate",
    readingTime: 6,
    tags: ["deload", "fatigue", "overtraining", "recovery", "programming"],
    sections: [
      {
        heading: "Accumulated Fatigue",
        body: "Fatigue is the normal, expected byproduct of hard training. The goal is to accumulate just enough stress to stimulate adaptation — then recover before adding more. Problems arise when fatigue accumulates faster than it dissipates: your joints ache, motivation tanks, performance stalls, and sleep suffers. This is the precursor to overtraining syndrome.",
      },
      {
        heading: "The Deload Week",
        body: "A deload is a planned week of reduced training volume and/or intensity — typically 40–60% of your normal workload. Take one every 4–8 weeks depending on training intensity and life stress. Signs you need one sooner: persistent joint pain, strength dropping across multiple sessions, dreading training, poor sleep quality. Deloads are not weakness — they're the mechanism that allows you to train hard long-term.",
      },
      {
        heading: "Reading Readiness Signals",
        body: "Before each session, rate your readiness on a simple 1–10 scale: motivation, sleep quality, muscle soreness, joint feel. If you're consistently 6 or below, reduce intensity or take extra rest rather than pushing through. Platforms like Kifted let you track sessions over time — look for trends where performance drops across multiple weeks as a signal to adjust.",
      },
      {
        heading: "Lifestyle Factors",
        body: "Training stress and life stress share the same recovery budget. A week of poor sleep, high work pressure, or travel on top of normal training volume can tip you into overreaching. Don't be afraid to autoregulate — reduce volume during high-stress life periods and build back up when things settle. Your long-term consistency matters more than any single week.",
      },
    ],
  },

  {
    slug: "active-recovery",
    title: "Active Recovery: Training on Rest Days",
    description:
      "Complete rest is often suboptimal. Low-intensity movement on rest days accelerates recovery, maintains momentum, and builds the aerobic base that makes all your hard training more effective.",
    category: "recovery",
    difficulty: "beginner",
    readingTime: 5,
    tags: ["active recovery", "rest days", "cardio", "mobility", "blood flow"],
    sections: [
      {
        heading: "Why Active Recovery Works",
        body: "Light movement on rest days increases blood flow to fatigued muscles without adding meaningful training stress. More blood flow means faster delivery of nutrients needed for repair and faster clearance of metabolic waste products like lactate. The result: you arrive at your next training session less stiff, less sore, and with better range of motion than if you'd spent the day completely sedentary.",
      },
      {
        heading: "What Qualifies as Active Recovery",
        body: "The key is keeping intensity well below your training threshold — typically below 60% of max heart rate. A 30–45 minute walk, a casual bike ride, light yoga, swimming at an easy pace, or a mobility circuit all qualify. The goal is to move, breathe, and promote circulation — not to build fitness or get another training stimulus. If you're breathing hard or muscles are burning, you've crossed out of recovery and into training.",
      },
      {
        heading: "Mobility Work as Active Recovery",
        body: "A 20–30 minute mobility session on a rest day is one of the highest-value uses of training-adjacent time. It addresses the flexibility and movement quality deficits that accumulate from heavy lifting, improves joint health over the long term, and requires zero recovery of its own. Focus on your personal tight spots: hip flexors and thoracic spine for most desk workers, ankles and adductors for most squatters.",
      },
      {
        heading: "What to Avoid on Rest Days",
        body: "Avoid anything that adds meaningful mechanical load to the muscles you trained most recently. If you squatted and deadlifted yesterday, a long hike with elevation is probably too much for a 'rest' day. Avoid high-intensity cardio (HIIT, sprints, heavy kettlebells) — these are training sessions, not recovery. Mental rest counts too: some people benefit from full days off from anything fitness-related to maintain psychological freshness.",
      },
    ],
  },
  {
    slug: "cold-therapy",
    title: "Cold Plunge & Cold Therapy: What the Science Says",
    description:
      "Cold therapy has exploded in popularity. Some of the hype is real — but some of it may actually undermine your training goals. Here's how to use cold intelligently.",
    category: "recovery",
    difficulty: "intermediate",
    readingTime: 6,
    tags: ["cold plunge", "ice bath", "recovery", "inflammation", "performance"],
    sections: [
      {
        heading: "The Established Benefits",
        body: "Cold water immersion (CWI) reduces subjective soreness and perceived fatigue after intense exercise — this is well-supported and consistent across studies. For athletes competing on consecutive days (team sports, tournaments), CWI is a legitimate tool to feel and perform better in subsequent sessions. The vasoconstriction and subsequent vasodilation also temporarily improve mood via norepinephrine release, which explains the mental clarity people report.",
      },
      {
        heading: "The Hypertrophy Problem",
        body: "A significant and somewhat uncomfortable finding: cold water immersion after strength training blunts muscle protein synthesis and may reduce hypertrophy over time. A 2015 study in the Journal of Physiology found that cold plunging after lifting significantly reduced long-term muscle and strength gains compared to active recovery. The inflammation that cold suppresses is actually part of the adaptation signal that drives muscle growth.",
      },
      {
        heading: "The Practical Protocol",
        body: "If hypertrophy is your primary goal: avoid cold immersion in the 4–6 hours after strength training. If performance or soreness management is the priority (you're an athlete competing repeatedly or managing pain): CWI is a reasonable tool post-training. Cold exposure first thing in the morning, hours before training, appears to have minimal negative impact on training adaptations while providing mood and alertness benefits.",
      },
      {
        heading: "Temperature and Duration",
        body: "For meaningful physiological effects, water temperature should be 50–59°F (10–15°C) for 10–15 minutes. Contrast therapy — alternating cold (1 min) and hot (4 min) for 3–5 cycles — shows similar subjective recovery benefits with less evidence for the hypertrophy blunting effect. Cold showers (while popular) are rarely cold or long enough to produce the same effects as true immersion; don't conflate the two.",
      },
    ],
  },

  // ── Compound Lifts ────────────────────────────────────────────────────────
  {
    slug: "overhead-press",
    title: "Overhead Press Fundamentals",
    description:
      "The overhead press is the definitive test of shoulder and upper-body pressing strength. Master the technique and watch your entire upper body develop.",
    category: "compound",
    difficulty: "beginner",
    readingTime: 6,
    tags: ["overhead press", "shoulders", "pressing", "upper body", "form"],
    sections: [
      {
        heading: "The Setup",
        body: "Hold the bar at shoulder level with a slightly wider than shoulder-width grip — thumbs wrapped around the bar. Wrists stacked above elbows. The bar should rest on the heel of your palm, not your fingers. Feet hip-width apart, slight forward lean in the hips. Take a big breath and brace your core before every rep.",
      },
      {
        heading: "The Press",
        body: "Drive the bar straight up while moving your head back slightly to give it a path. Once the bar passes your forehead, push your head through and finish with the bar directly over the middle of your foot, arms locked out. A key cue: squeeze your glutes to prevent lower-back hyperextension, which is the most common error in the overhead press.",
      },
      {
        heading: "Common Mistakes",
        body: "Pressing with a forward bar path (bar moves away from your body) means you're using anterior deltoid instead of distributing load. Flaring elbows too wide stresses the AC joint. Hyperextending the lower back turns it into a behind-the-neck press variant — adds spinal load without adding muscle stimulus. Fix these early before they become habits.",
      },
      {
        heading: "Programming the OHP",
        body: "The overhead press is the weakest of the big pressing movements — expect to press roughly 60–65% of your bench press max. Progress more slowly than the bench press. Running it as a secondary pressing movement (Bench day 1, OHP day 2) is the most common approach. Add lateral raises and face pulls as accessories to build the supporting musculature.",
      },
    ],
  },
  {
    slug: "rdl-vs-conventional",
    title: "Romanian vs Conventional Deadlift",
    description:
      "Both movements hinge at the hips and target the posterior chain — but they have distinct mechanics, strengths, and use cases in a program.",
    category: "compound",
    difficulty: "intermediate",
    readingTime: 6,
    tags: ["deadlift", "RDL", "hamstrings", "posterior chain", "hip hinge"],
    sections: [
      {
        heading: "The Key Mechanical Difference",
        body: "The conventional deadlift starts from the floor with the bar at rest — your hips are lower at the start, knees bend significantly, and the movement pattern is a combined hip-and-knee extension. The Romanian deadlift (RDL) starts from standing — you hinge forward with a soft knee bend, lowering the bar to mid-shin by pushing your hips back, then driving them forward to return to standing.",
      },
      {
        heading: "When to Use the RDL",
        body: "RDLs are a superior hypertrophy tool for the hamstrings and glutes because they emphasize the stretch under load — the most potent stimulus for muscle growth in the posterior chain. They're also lower-fatigue than conventional deadlifts, making them ideal as a secondary posterior chain movement on a second leg day or as an accessory after squats.",
      },
      {
        heading: "When to Use the Conventional",
        body: "Conventional deadlifts are a true strength test and the better choice for building total-body pulling strength. They allow more weight to be moved through a larger range of motion. If you're training for powerlifting, general strength, or want to track a benchmark lift, the conventional is your primary movement.",
      },
      {
        heading: "Programming Both Together",
        body: "A common and effective approach: Leg Day 1 — Squat as primary + RDL as accessory. Leg Day 2 — Conventional Deadlift as primary + leg curl or hip thrust as accessory. This structure develops hip hinge strength with the conventional while using the RDL to target hypertrophy-specific hamstring and glute development.",
      },
    ],
  },
  {
    slug: "pull-up-progression",
    title: "The Pull-Up Progression Guide",
    description:
      "Pull-ups are one of the best upper-body exercises in existence — and one of the hardest to learn. Here's a progression roadmap from zero to 10 reps.",
    category: "compound",
    difficulty: "beginner",
    readingTime: 7,
    tags: ["pull-ups", "back", "lats", "bodyweight", "progression"],
    sections: [
      {
        heading: "Why Pull-Ups Are Worth the Effort",
        body: "Pull-ups develop the latissimus dorsi (lats), rhomboids, rear deltoids, biceps, and core simultaneously. They're harder to cheat than machine alternatives, highly scalable, and an excellent indicator of relative strength. A person who can do 10 strict pull-ups has an impressive base of upper-body pulling strength.",
      },
      {
        heading: "Stage 1: Building the Foundation (0 pull-ups)",
        body: "Dead hangs: hang from the bar for 3 sets of 20–30 seconds — builds grip strength and shoulder stability. Scapular pull-ups: from a dead hang, retract and depress your shoulder blades without bending your elbows. Lat pulldowns: 4 sets of 8–12 reps at a weight you can control. Negative pull-ups: jump to the top position and lower yourself as slowly as possible (3–5 seconds). Do this 3x/week.",
      },
      {
        heading: "Stage 2: First Reps (1–5 pull-ups)",
        body: "Band-assisted pull-ups reduce the effective load and let you practice the movement pattern at full range. Use a band that lets you get 5–8 reps per set — lighter band over time as you get stronger. Alternate band-assisted sets with negative sets. Aim to add one rep per week or reduce band assistance every 2 weeks.",
      },
      {
        heading: "Stage 3: Building Reps (5–10+ pull-ups)",
        body: "Grease the groove: perform 2–3 submaximal pull-up sets throughout the day, spread across multiple sessions. If your max is 6, do sets of 3–4 multiple times daily (never going to failure). This high-frequency, low-fatigue approach rapidly increases your rep ceiling. Add weighted pull-ups once you can hit 10 clean reps — 5–10 lb in a belt is a new challenge that drives further adaptation.",
      },
    ],
  },
  {
    slug: "hip-hinge",
    title: "Hip Hinge Mastery: The Foundation of All Pulling",
    description:
      "The hip hinge is the most important movement pattern you're probably not training deliberately. Every pulling movement — deadlifts, RDLs, rows, kettlebell swings — is built on this foundation.",
    category: "compound",
    difficulty: "beginner",
    readingTime: 6,
    tags: ["hip hinge", "deadlift", "movement pattern", "posterior chain", "fundamentals"],
    sections: [
      {
        heading: "What a Hip Hinge Is",
        body: "A hip hinge is a movement where the primary motion is at the hip joint — pushing your hips back — with minimal change in knee angle. This is in contrast to a squat, where both the hips and knees bend equally. The spine stays neutral (not flexed or hyperextended) throughout. Most people who learned to 'bend your knees when lifting' were taught the squat pattern; the hip hinge is the equally important counterpart.",
      },
      {
        heading: "Why People Get It Wrong",
        body: "Most sedentary adults have lost the ability to hinge well. When asked to bend forward, they either round their lower back (spine flexion under load — dangerous) or bend their knees into a quarter squat. The hip hinge requires posterior chain flexibility (hamstrings, glutes) and the proprioceptive awareness of where your spine is in space. Both can be trained quickly with the right drills.",
      },
      {
        heading: "Learning the Pattern",
        body: "The wall drill: stand 6 inches from a wall, push your hips back until they touch it while keeping your shins vertical and back flat. That's the hinge. Progress to the dowel drill: hold a dowel rod along your spine (head, upper back, tailbone contact) while hinging — the dowel reveals any spine rounding immediately. Once the pattern feels natural, load it with a Romanian deadlift using light weight.",
      },
      {
        heading: "Applying the Hinge to Heavy Pulls",
        body: "Every deadlift variation starts with a hip hinge to get into position. The cue 'push the floor away' (rather than 'pull the bar up') reinforces that the hip extension drives the lift, not the lower back. On every heavy pull, think about snapping your hips forward to lockout rather than extending your spine. If your lower back is always what's sore after deadlifts, you're hinging incorrectly — your glutes and hamstrings should be what's fatigued.",
      },
    ],
  },
  {
    slug: "front-squat-vs-back-squat",
    title: "Front Squat vs. Back Squat",
    description:
      "Both are excellent compound movements, but they stress the body differently and suit different goals. Understanding when and why to use each will make your leg programming far more intelligent.",
    category: "compound",
    difficulty: "intermediate",
    readingTime: 6,
    tags: ["front squat", "back squat", "legs", "quads", "programming"],
    sections: [
      {
        heading: "The Core Mechanical Difference",
        body: "The back squat places the bar behind your head, shifting the center of mass toward the hips and allowing a forward lean — recruiting more of the posterior chain (glutes, hamstrings, lower back). The front squat places the bar on the front deltoids, requiring a more upright torso. This upright position places the majority of the load on the quadriceps and demands significantly more thoracic extension and ankle mobility.",
      },
      {
        heading: "Quad Emphasis and Depth",
        body: "Front squats are arguably the best barbell exercise for isolating the quadriceps. The combination of a more vertical torso, forward knee travel, and the natural tendency to squat deeper makes them superior to back squats for quad hypertrophy. If building thicker, more developed quads is a priority — particularly the vastus medialis (the teardrop) — front squats deserve a place in your program.",
      },
      {
        heading: "Load and Learning Curve",
        body: "Most people front squat 70–80% of their back squat maximum. The front rack position (bar resting on front deltoids, elbows high) takes weeks of dedicated practice to feel natural. Wrist flexibility and shoulder mobility are often the bottleneck. Cross-arm grip is an alternative for those with limited wrist mobility, though it's less stable. Expect the movement to feel awkward for the first several weeks — persist through it.",
      },
      {
        heading: "Programming Both Together",
        body: "The most complete leg development comes from including both patterns. Back squat as the primary strength movement (heavier, less frequency, progressive overload focus), front squat as a secondary movement for quad emphasis and technique development. Alternatively, front squats are excellent for Olympic lifting athletes, as they directly train the catch position of the clean. Some powerlifters use front squats as a squat accessory to reinforce an upright torso in their competition lift.",
      },
    ],
  },
];

export function getGuideBySlug(slug: string): Guide | undefined {
  return allGuides.find((g) => g.slug === slug);
}

export function getGuidesByCategory(category: GuideCategory): Guide[] {
  return allGuides.filter((g) => g.category === category);
}

export function getFeaturedGuide(): Guide {
  return allGuides.find((g) => g.featured) ?? allGuides[0];
}

export const CATEGORIES: GuideCategory[] = [
  "beginner",
  "strength",
  "hypertrophy",
  "nutrition",
  "recovery",
  "compound",
];
