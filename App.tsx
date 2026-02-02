import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Vector2, Particle, GameState } from './types';
import { Explosion } from './components/Explosion';

// --- Constants ---
const BUTTON_WIDTH = 140; 
const BUTTON_HEIGHT = 50;
const MAX_PARTICLES = 40;
const FINAL_REVEAL_AT = 49; // Reveal on the 49th click (Step 48 displayed)

// --- Sound Utilities ---
const playSound = (type: 'heartbeat' | 'climax' | 'thud') => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  
  const ctx = new AudioContext();
  const t = ctx.currentTime;

  if (type === 'heartbeat') {
    // Deep thud, low frequency
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Pitch drops quickly
    osc.frequency.setValueAtTime(60, t);
    osc.frequency.exponentialRampToValueAtTime(10, t + 0.15);
    
    gain.gain.setValueAtTime(1.0, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(t);
    osc.stop(t + 0.2);

  } else if (type === 'thud') {
    // Sharp impact
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.1);
    
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(t);
    osc.stop(t + 0.15);

  } else if (type === 'climax') {
    // Ethereal chord
    const freqs = [220, 277, 330, 440, 554];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = f;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.1, t + 1 + i*0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 6);
    });
  }
};

// --- Helper Functions ---
const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;
const randomChoice = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

// --- STORY ENGINE ---
// 49 Story Steps + 1 Intro = 50 Interaction Steps. 
// Index 48 is the Final Proposal text.

const STORIES = [
  {
    id: 'sensual',
    no: [
      "I gently cup your face in my hands, my thumbs slowly brushing against the warmth of your cheeks as I gaze deeply into your eyes, looking for a sign.",
      "You lean into my touch, your eyes fluttering shut as you surrender to the moment, the world around us fading into a soft, insignificant blur.",
      "My other hand finds its way to your waist, resting there lightly at first, but with a promise of the firmness and possession that is to come.",
      "I step closer, slowly eliminating the final inch of space between us until our bodies are lightly touching, heat radiating through our clothes like a fever.",
      "My fingers trace the sharp line of your jaw, memorizing every curve of your face as if it were a precious map I never want to lose.",
      "I lean down and whisper your name against your ear, my breath hot and ghosting over your sensitive skin, making you shiver in anticipation.",
      "Your breath hitches audibly as I gently nip your earlobe, a playful, sharp bite that sends a jolt of pure electricity down your spine.",
      "My hand slides down from your waist to your hip, fingers digging in slightly, pulling you flush against me so you can feel the reality of my desire.",
      "I can feel your heart beating wildly against my chest, a frantic, heavy rhythm that matches the thudding of my own blood rushing in my ears.",
      "My nose brushes against the soft skin of your neck, inhaling your unique scent—intoxicating, sweet, and undeniably yours, filling my lungs.",
      "I press a soft, lingering kiss to the pulse point of your throat, tasting the salt on your skin as you tilt your head back to give me access.",
      "My hands roam down your back to grip your ass firmly, kneading the soft flesh through your clothes and pulling you even harder against my groin.",
      "I lift you slightly, pressing you back against the cool wall, creating a delicious contrast between the cold surface and the burning heat of my body.",
      "My knee slides confidently between your legs, the denim creating friction against your center that makes you gasp aloud and arch into me.",
      "You gasp as the pressure builds right where you need it, your hips instinctively bucking forward to meet the intrusion of my leg against your heat.",
      "My hand moves up your thigh, sliding under the hem of your skirt, my fingers dancing over the sensitive skin of your inner leg, teasing you.",
      "Your skin is incredibly hot to the touch, burning with a fever that only I can break, trembling under my fingertips as I inch higher.",
      "I graze the silky fabric of your panties, teasing the very edge of them without slipping underneath just yet, making you wait and whine for it.",
      "You're already soaking wet for me, aren't you? I can feel the damp heat radiating through the thin lace barrier against my fingers.",
      "I hook a single finger under the lace, slowly tugging it aside to reveal the slick, swollen pearl that has been waiting for my touch.",
      "I find your clit, swollen and desperate, and I give it a soft flick with my thumb that makes your knees buckle instantly beneath you.",
      "My fingers slip inside you, coating themselves in your slickness, finding you so tight yet yielding perfectly to my touch as I push deeper.",
      "You moan loudly into my mouth as I find your internal rhythm, curling your fingers into my shirt to keep yourself upright against the pleasure.",
      "I tease you, circling the entrance and rubbing your spot, bringing you to the very edge of the cliff before stopping abruptly, leaving you gasping.",
      "I pull my hand away, leaving you whining and empty, a sound of pure frustration escaping your lips as you instinctively chase my touch.",
      "I lift your chin, forcing you to look at me through your haze of lust. 'Beg for it,' I whisper, demanding your complete submission.",
      "You tremble, your eyes dark with a primal need, your lips parting to form the words I want to hear, but I silence you with a bruising kiss.",
      "I kiss you deeply, my tongue sweeping into your mouth to taste you, swallowing your moan as our saliva mixes and our breath mingles.",
      "I unbutton my pants, the sound loud in the quiet room, letting you see exactly how hard I have become just for you, throbbing in the air.",
      "Your hand reaches out to touch me, but I catch your wrist. 'Not yet,' I growl against your lips. 'I want to watch you unravel first.'",
      "I rub the broad head of my cock against your soaking wet entrance, coating myself in your juices without entering, sliding through your slickness.",
      "You buck your hips wildly, desperate for the friction, desperate to be filled, a pathetic whimper tearing from your throat as I deny you.",
      "I slide just the tip in, stretching you open, letting you feel the girth of me before I pull back out, teasing you mercilessly with the promise.",
      "You cry out, digging your nails into my shoulders, your body arching off the wall in a silent, desperate plea for me to finish it.",
      "I pull back out completely. Teasing. Then I drop to my knees, burying my face between your trembling thighs, smelling your arousal.",
      "I replace my cock with my tongue, flicking your clit with a wet, broad stroke that makes you scream my name and tangle your hands in my hair.",
      "I devour you, tasting my own work on your skin, humming against your most sensitive spot as you shake above me, legs weakening.",
      "I wrap my tongue around your clit, sucking hard while two fingers push deep inside you, mimicking the thrusts you are begging for.",
      "Your legs shake violently around my head, your hands tangling in my hair as I drink you down, unstopping, loving your taste.",
      "I stand up abruptly, lifting your legs to wrap around my waist, needing to be inside you right this second, no more waiting.",
      "I thrust into you, deep and sudden, burying myself to the hilt in one fluid motion that knocks the breath out of you completely.",
      "We find a rhythm, hard and fast against the wall, the slapping of skin and your ragged breathing filling the air between us.",
      "Every thrust hits that perfect spot deep inside, making your vision blur and your toes curl in ecstasy as I claim you.",
      "You're incoherent, gasping my name like a prayer, your head thrown back, exposing your beautiful neck to my biting kisses.",
      "I feel your walls clamping down on me, milking me with every stroke, urging me to let go and finish deep inside you.",
      "I speed up, chasing your release, pounding into you with everything I have, needing to feel you break and shatter in my arms.",
      "You scream as you come apart, your body convulsing around my cock in powerful, rhythmic waves that nearly force me over the edge.",
      "I pour myself inside you, endless and hot, groaning as I spend every drop of my desire deep within your warmth, marking you.",
      "Just say Yes, my love, and I will be yours forever."
    ],
    yes: [
      "Don't stop.", "I'm listening.", "Hold me.", "Closer.", "Trace me.",
      "Say it again.", "Don't stop.", "Pull me in.", "I can't help it.", "Smell me.",
      "Kiss me there.", "Grab me.", "Press harder.", "Friction.", "Gasping.",
      "Explore.", "I'm burning.", "Touch me.", "So wet.", "Pull them off.",
      "Find it.", "Deeper.", "Rhythm.", "Please.", "Why stop?",
      "I'm begging.", "Need you.", "Swallow it.", "Show me.", "Let me touch.",
      "Watch me.", "Rub it.", "I need it.", "Stretch me.", "Digging in.",
      "Don't leave.", "Taste me.", "Devour me.", "Suck it.", "Unstopping.",
      "Lift me.", "Thrust.", "Harder.", "Perfect.", "My name.",
      "Clamping.", "Chasing it.", "Screaming.", "Fill me.", "Yours."
    ]
  },
  {
    id: 'dominant',
    no: [
      "I grab your wrist firmly, pinning it to your side with a strength that tells you struggling against me is completely and utterly pointless.",
      "I tilt your chin up with my fingers, forcing you to look me in the eyes. 'Look at me when I touch you,' I command softly.",
      "Your eyes widen with a mix of fear and arousal, but you don't pull away. You know exactly who is in charge here tonight.",
      "I run a hand down your arm, possessive and heavy, letting you feel the absolute weight of my claim on your body.",
      "Be a good girl and stand perfectly still for me. Don't move a single muscle unless I tell you to. Do you understand?",
      "I spin you around roughly, pressing your back against my chest, trapping you between my hard body and the open room.",
      "My arm wraps around your throat, not choking, but resting there dangerously, a constant reminder of my control over your breath.",
      "I whisper dark, filthy promises into your ear, telling you exactly how I'm going to use you and break you tonight.",
      "You shudder violently, your knees getting weak, your resistance melting away into submission with every word I speak.",
      "I grind my hips against your ass, hard and unyielding, letting you feel the rock-hard proof of my desire pressing into you.",
      "You can feel exactly how hard I am for you, pressing into your lower back, demanding attention that you are desperate to give.",
      "My hand finds the zipper of your dress, and I pull it down slowly, the sound tearing through the silence like a scream.",
      "I push the fabric off your shoulders roughly, watching it pool at your feet, leaving you shivering in the cool air, exposed.",
      "You step out of the dress, standing before me in nothing but your lace set, looking vulnerable and beautifully exposed to my gaze.",
      "My cold rings graze your bare nipples, causing them to harden instantly under the shock of the metal and my touch.",
      "I pinch them, twisting slightly, making you whimper in pain that quickly bleeds into intense pleasure, confusion in your eyes.",
      "My other hand slides down your stomach, fingers splayed wide, claiming every inch of skin they touch as my territory.",
      "I command you to spread your legs wider. 'Wider,' I growl, kicking your feet apart until you are completely open for me.",
      "My fingers dive straight between your lips, checking your readiness without asking for permission, claiming what is mine.",
      "Sopping wet. You needed this. You've been dripping for me while pretending to resist, haven't you? You little liar.",
      "I circle your clit with maddening slowness, denying you the release you so clearly want, making you squirm and beg silently.",
      "You beg me to just put it in, your hips bucking back against my hand, but I hold you firm, denying you.",
      "I slide two fingers deep inside you, hooking upwards, curling them in a 'come here' motion that hits your G-spot perfectly.",
      "I fuck you with my hand, relentless and fast, matching the savage rhythm of your breathing, making you gasp.",
      "I withdraw my hand and turn you to face me. 'On your knees,' I order, pointing to the floor. 'Now.'",
      "You drop instantly, looking up at me with those big, submissive eyes, waiting for my next command, desperate to please.",
      "I take my cock out, fully erect and twitching. 'Open wide,' I say, stepping closer to your face, looming over you.",
      "You take me into your mouth, wrapping your lips around me, taking me as deep as you can manage, gagging slightly.",
      "I tangle my hand in your hair, gripping the strands tightly to hold you in place as I begin to fuck your mouth.",
      "I control the rhythm, thrusting into your throat, making you gag as tears prick the corners of your eyes, but you take it.",
      "I pull you up by your hair, dragging you over to the bed and throwing you down onto the mattress like a ragdoll.",
      "I crawl over you like a predator, grabbing both your wrists and pinning them high above your head, rendering you helpless.",
      "I spread your legs wide with my knee, settling between them, looking down at my conquest, savoring your vulnerability.",
      "I lean down and lick a stripe from your navel to your chest. 'Mine,' I whisper against your skin, marking you.",
      "I lift your hips and bury my face in your ass, rimming you with a hard, wet tongue that makes you scream in shock.",
      "I alternate between licking your clit and teasing your hole, overstimulating you until you're sobbing, unsure where the pleasure ends.",
      "I spread your cheeks and press my tongue deep into your hole, tasting you while my fingers keep your clit on edge.",
      "I align myself with you and drive inside, claiming what's mine with a single, brutal thrust that fills you completely.",
      "You scratch my back, desperate for more, your nails digging in as I pound into you without mercy or hesitation.",
      "I see the orgasm building in your eyes, the way they lose focus, the way your breath catches in your throat.",
      "I cover your mouth with my hand so you don't scream, smothering your cries as I drive you over the edge.",
      "Your body convulses, tightening around me like a vice, milking me with spasms that nearly break my control.",
      "I don't let up, pounding through the waves of your pleasure, ensuring you feel every second of my possession.",
      "You sob into my hand, overwhelmed by the intensity, completely broken down and rebuilt by my touch.",
      "I finish deep, groaning as I mark you inside, filling you with everything I have kept held back, owning you.",
      "I collapse next to you, pulling you into my chest, keeping you close and safe in the aftermath of our storm.",
      "I trace the red mark on your neck where I grabbed you. 'You did well,' I whisper into your hair.",
      "You lay there, ruined, messy, and absolutely beautiful in your submission, eyes still rolling back.",
      "There is no choice left. You belong to me now, body and soul.",
      "Submit. Say Yes. Take it."
    ],
    yes: [
      "Don't let go.", "I'm looking.", "I won't run.", "Mark me.", "I'm yours.",
      "Hold me tight.", "Claim me.", "Tell me.", "Weak for you.", "Harder.",
      "I feel it.", "Take it off.", "Unzip me.", "Push it down.", "I'm bare.",
      "Touch them.", "Harden.", "Make me cry.", "Lower.", "Open.",
      "Touch me.", "I need it.", "Don't stop.", "Please.", "Deeper.",
      "Relentless.", "Turn me.", "I'm down.", "I want you.", "Open.",
      "Taste you.", "Hold me.", "Control me.", "Take me there.", "Throw me.",
      "Pin me.", "Spread me.", "Claim me.", "Mine.", "Rimming.",
      "Tongue deep.", "Thrust.", "Desperate.", "Building.", "Silence me.",
      "Tightening.", "Pound me.", "Overwhelmed.", "Fill me.", "Submit."
    ]
  },
  {
    id: 'shower',
    no: [
      "I step into the steam, closing the glass door behind me, sealing us in this small, misty world away from everything else.",
      "Water runs down your face, plastering your hair to your skin, making you look like a beautiful, wild sea creature.",
      "I push the wet strands back from your forehead, my eyes locking onto yours through the falling droplets, intense and hungry.",
      "You look up at me, water catching on your long lashes, blinking rapidly as the spray hits your face, waiting for me.",
      "I run the soap bar over your shoulders, creating a rich lather that makes your skin slippery and impossibly smooth.",
      "My slick hands glide down your arms, exploring every muscle, every curve, washing away everything but the desire between us.",
      "I turn you to face the spray, letting the hot water heat your front while I press my body against your back.",
      "I press my chest against your wet back, skin sliding against skin, the friction electric and heightened in the steam.",
      "Hot water cascades over both of us, binding us together in a waterfall of heat and desire, blurring the lines.",
      "I kiss the wet skin of your shoulder, tasting the clean water and the salt of your skin beneath, savoring it.",
      "My soapy hands slide around to your chest, cupping the weight of your breasts, slippery and soft in my grip.",
      "I massage your breasts, tweaking your nipples which are hard from the temperature change and my rough touch.",
      "The water washes the suds down your belly, a trail of white foam leading straight to your hips, beckoning me.",
      "I follow the water with my hands, tracing the path down your stomach to the curve of your waist, gripping you.",
      "I move lower, my hands sliding over your hips, gripping them to hold you steady against me as I get harder.",
      "I turn you around to face me again, lifting you up effortlessly in the buoyant water, your legs wrapping around me.",
      "I wrap your legs around my waist, your arms instinctively clinging to my wet shoulders for support as I hold you up.",
      "I press you against the cold tile wall, the shock making you gasp and tighten your grip on me, seeking warmth.",
      "My fingers find your center, indistinguishable from the water running down your legs, but so much hotter and inviting.",
      "The sound of the shower masks the wet, squelching noise of my fingers working you open, preparing you for me.",
      "I rub your clit with my thumb, using the water as lubricant, flicking it rapidly with my wet tongue as I lean in.",
      "You throw your head back into the spray, mouth open in a silent cry as I tease you with my mouth and hands.",
      "I stand back up and tease your entrance with the head of my cock, rubbing against your slick folds, making you whine.",
      "I slide in, smooth and hot, the water making the entry effortless as I fill you completely, stretching you wide.",
      "The water amplifies every sensation, the steam making everything feel dreamlike and intense, like we are the only two people alive.",
      "I piston into you, splashing water against the glass walls with the force of our movements, reckless and wild.",
      "You tighten your legs around my waist, your heels digging into my back, locking me inside you, refusing to let go.",
      "I bite your wet lip, tasting the water and your breath, devouring you under the spray, drinking your moans.",
      "I slow down, grinding deep circles into your hips, hitting angles that are only possible right here, suspended in the water.",
      "You whimper, close to the edge, your fingernails scratching against the wet tiles seeking purchase, unable to find it.",
      "I stop moving abruptly. 'Ask nicely,' I whisper against your wet neck, teasing you, making you earn your release.",
      "You whisper 'please' against my mouth, desperate, shivering from both the water and the need consuming you completely.",
      "I start again, harder than before, punishing you for making me wait, slamming into you with animalistic force.",
      "I slam into you, shaking the glass door, the sound of our bodies meeting echoing in the stall, mixing with the water.",
      "The steam makes it hard to breathe, adding a layer of suffocation to the pleasure that is overwhelming us both.",
      "We're slipping against each other, sweat and water mixing, struggling to keep our footing in the best possible way.",
      "I grab your ass, pulling you deeper onto me, ensuring there is no space left between us, fusing us together.",
      "Your orgasm hits, shaking your whole body, your inner muscles clamping down on me tight, milking me dry.",
      "I hold you up as your legs give out, supporting your weight as you ride out the waves of your climax.",
      "I'm not done with you yet. I need to feel you shudder one more time before we leave this shower.",
      "I let you down and turn you around, bending you over so your hands rest on the floor, water hitting your back.",
      "I enter you from behind, the water hitting your back as I drive into you from a new angle, deeper than before.",
      "You cry out, the pleasure too intense, the water hitting your sensitive spots while I fill you, overstimulating you.",
      "I drive hard, primal and wet, losing myself in the sound of the water and your moans echoing off the tile.",
      "I come with a roar, filling you up, my release mixing with the hot water swirling around the drain.",
      "The water rinses us clean, but we're shaking, exhausted and sated in the steam, holding onto each other.",
      "I kiss your forehead, holding you close under the gentle spray, washing the sweat from your hair.",
      "Turn off the water. Stay here with me in the warmth a little longer.",
      "Say Yes and I'll keep you warm forever."
    ],
    yes: [
      "Come in.", "Soak me.", "Touch me.", "I see you.", "Soap me.",
      "Slippery.", "Turn me.", "Press against me.", "Burn me.", "Kiss me.",
      "Touch them.", "Soft.", "Wash me.", "Follow it.", "Lower.",
      "Face you.", "Lift me.", "I'm holding.", "Cold tile.", "Find it.",
      "Mask it.", "Rub it.", "Head back.", "Tease me.", "Slide in.",
      "Feel it.", "Splash.", "Tightening.", "Bite me.", "Grind.",
      "Close.", "Make me ask.", "Please.", "Harder.", "Shake it.",
      "Can't breathe.", "Slipping.", "Deeper.", "Shaking.", "Hold me.",
      "Not done.", "Turn me.", "Bend me.", "Behind.", "Too much.",
      "Primal.", "Fill me.", "Clean.", "Close.", "Warm me."
    ]
  },
  {
    id: 'massage',
    no: [
      "I pour warm, scented oil into my palms, rubbing them together to generate heat before I touch you, preparing your skin.",
      "You're lying face down on the bed, waiting, your breathing already slowing in anticipation of my hands on your body.",
      "I spread the oil across your shoulders in broad, sweeping strokes, coating your skin in a golden sheen.",
      "My thumbs dig into your tight muscles, working out the stress of the day, making you groan into the mattress.",
      "You moan into the pillow as I find a knot and work it loose with deliberate, firm pressure.",
      "I move lower, running my thumbs down either side of your spine, counting the vertebrae as I go.",
      "My hands span your waist, squeezing the soft flesh there, hinting that this isn't just a massage anymore.",
      "I slide the towel down to expose your ass, the cool air hitting your skin before my hot, oily hands do.",
      "I knead your glutes firmly, my fingers digging in, making your hips rock involuntarily into the mattress under my touch.",
      "You wiggle your hips under my touch, a silent signal that you're enjoying exactly where this is going.",
      "I run my hands down the backs of your thighs, slick with oil, making your skin gleam in the dim light.",
      "I part your legs slightly, stepping between them to get better leverage, pressing my thighs against yours.",
      "My hand grazes your inner thigh, dangerously close to your center, teasing you with near-misses that make you twitch.",
      "I move back up, teasing the cleft of your ass with an oily thumb, pressing just slightly to gauge your reaction.",
      "I lean down and whisper for you to turn over. 'I want to see your front,' I murmur into your ear.",
      "You roll over slowly, flushed and oily, your hair messy, looking absolutely ravishing and ready for me.",
      "Your breasts glisten in the dim light, coated in a thin layer of sweat and oil, heaving with your breath.",
      "I massage them with the remaining oil on my hands, cupping their weight, tweaking your nipples which are hard.",
      "My thumbs flick over your nipples rapidly, watching them bead up hard against the slickness of the oil.",
      "My hand slides down your oily stomach, fingers swirling around your navel, moving lower and lower.",
      "I slip my hand between your legs, the oil mixing with your natural wetness to create a perfect slip-n-slide.",
      "My fingers are slick with oil and your juices as I rub you, sliding effortlessly over your clit, fast and smooth.",
      "I slide two fingers effortlessly inside you, the oil making the entry incredibly smooth, feeling every ridge.",
      "You arch your back off the table, exposing your neck, a silent plea for me to taste you and mark you.",
      "I use the oil to stroke your clit fast, the lack of friction allowing for intense speed that makes you gasp.",
      "You're a slippery, moaning mess, twisting your hips, trying to get more of my hand inside you.",
      "I lean down and lick a drop of oil from your chest, tasting the lavender and the salt of your skin.",
      "My tongue trails down your stomach to your navel, slurping up the oil as I go, making you shiver.",
      "I blow cool air on your wet skin, making you shiver violently from the sensation contrast of hot oil and cold breath.",
      "You shiver, reaching for my head, guiding me down to where you need me most, fingers tangling in my hair.",
      "I kiss your inner thigh, teasing the sensitive skin there, inhaling your musky scent mixed with the oil.",
      "I spread your cheeks and deliver a hard, wet lick to your asshole, shocking you with the sudden intimacy.",
      "I eat you out, messy and loud, my tongue flicking your clit while my finger plays with your ass.",
      "You grab my hair, hips bucking wildly, your thighs clamping around my head to keep me there, drowning me.",
      "I drink every drop you give me, loving the taste of you mixed with the massage oil, slick and sweet.",
      "I stand up and drag you off the table, needing to feel your body against mine fully, skin to skin.",
      "I push you onto the bed, the sheets absorbing some of the oil but we don't care about the mess.",
      "My cock is glistening with your oil, transferred from my hands, ready to slide inside you without resistance.",
      "I slide in without using my hands, the lubrication making it happen in one smooth motion that takes your breath away.",
      "It feels impossibly smooth, the oil reducing all friction until it's just pure sensation and pressure.",
      "I fuck you slow, savoring the glide, the squelching sound of our bodies meeting filling the quiet room.",
      "You wrap your oily legs around my neck, sliding off because of the slickness, laughing breathlessly before moaning.",
      "I pound into you until you see stars, gripping your oily hips to keep you in place against the headboard.",
      "Your body goes rigid, toes curling, your eyes rolling back as the climax hits you like a freight train.",
      "I ride out your orgasm with you, letting your spasms milk me until I can't hold back anymore.",
      "I collapse on top of you, sliding against your skin, unable to find purchase, just breathless and spent.",
      "We're covered in sweat and oil, sticking together, messy and perfect in the afterglow.",
      "I kiss the tip of your nose, smiling at the wreck we've made of the bed and ourselves.",
      "You're glistening like a masterpiece, and I want to do it all over again.",
      "Say Yes and I won't stop."
    ],
    yes: [
      "Warm it.", "Waiting.", "Spread it.", "Dig in.", "Moaning.",
      "Lower.", "Squeeze.", "Expose it.", "Firmly.", "Wiggling.",
      "Touch me.", "Part them.", "Graze me.", "Tease me.", "Turn me.",
      "I'm flushed.", "Glisten.", "Touch them.", "Flick them.", "Lower.",
      "Slip in.", "Slick.", "Slide.", "Arching.", "Stroke it.",
      "Messy.", "Lick it.", "Trail down.", "Cool air.", "Shiver.",
      "Kiss me.", "Rimming.", "Eat me.", "Bucking.", "Drink.",
      "Drag me.", "Push me.", "Glistening.", "No hands.", "Smooth.",
      "Savor it.", "Wrap them.", "Stars.", "Rigid.", "Ride it.",
      "Collapse.", "Covered.", "Kiss me.", "Masterpiece.", "Don't stop."
    ]
  },
  {
    id: 'teasing',
    no: [
      "We're in a crowded restaurant, but I can't stop looking at you like I want to eat you right here on the table.",
      "I slide my hand onto your thigh under the table, hidden by the tablecloth from prying eyes around us.",
      "You jump slightly, looking around nervously to see if anyone noticed my wandering hand moving higher.",
      "I smile innocently and push my hand higher, my fingers inching towards your hemline with deliberate slowness.",
      "Your skirt hides my movements perfectly, creating a secret world just for the two of us in this busy room.",
      "I rub small circles on your inner thigh, feeling the heat radiating off your skin through the fabric.",
      "You try to keep a straight face, sipping your wine, but I see your hand trembling on the stem of the glass.",
      "My fingers brush the fabric of your panties, feeling the dampness already gathering there, betraying your arousal.",
      "I lean in and whisper exactly what I want to do to you, using the filthiest words I know to make you blush.",
      "You flush bright red, biting your lip to keep from making a sound in the quiet room, eyes darting around.",
      "I move my hand to your other leg, squeezing your thigh possessively, claiming you right under everyone's nose.",
      "I squeeze hard, leaving a mark that you'll see later and think of me when you undress alone.",
      "I suggest we go to the bathroom. 'Right now,' I mouth, leaving no room for argument or hesitation.",
      "We stumble into the handicapped stall together, locking the door with a loud click that echoes in the silence.",
      "I hike your skirt up to your waist immediately, bunching the fabric in my fists to expose you.",
      "No panties? You naughty girl. You knew exactly what was going to happen tonight, didn't you?",
      "I push you back against the cold door, the metal biting into your back as I press my body against yours.",
      "My mouth devours yours hungrily, swallowing your gasps so no one outside hears us in here.",
      "My hand goes straight to your clit, rubbing it hard and fast, no time for foreplay, just need.",
      "You have to be quiet, someone might hear us. The thrill of getting caught makes it so much hotter.",
      "I make you gag on my tongue, kissing you deeply to stifle the moans rising in your throat.",
      "My fingers pump into you fast, creating a wet sound that seems deafening in the small, tiled space.",
      "You're shaking, trying not to scream, your knuckles white as you grip the grab bar for support.",
      "I stop abruptly. 'Quiet,' I warn, pulling my hand away. 'Someone just walked in.' We freeze.",
      "I listen to footsteps outside, watching your chest heave as you try to control your breathing and stay silent.",
      "I unzip my pants, the sound loud, and take my cock out. 'Wrap your tongue around it,' I whisper.",
      "You drop to your knees and take me deep, bobbing your head while we listen to strangers wash their hands.",
      "I force you to deep throat me, holding your head, fucking your mouth while the door handle jiggles.",
      "I lift you up, wrapping your legs around my waist, pressing you against the wall, needing inside you.",
      "I slide inside you in one thrust, filling you completely while you bury your face in my neck to scream.",
      "You bite my shoulder to stifle a moan, the pain grounding me as I begin to move inside you.",
      "I fuck you silently, brutal and deep, short thrusts to keep the noise down but the pleasure high.",
      "Every thrust knocks the door slightly, a rhythmic thud that risks exposing us to the room outside.",
      "The danger makes you tighter, your walls clamping around me with terrified intensity that drives me crazy.",
      "I can feel you pulsing around me, milking me, begging for release in silence, tears in your eyes.",
      "I pinch your nipple hard through your blouse to distract you from screaming, giving you pain to focus on.",
      "You sob silently into my neck, tears of frustration and pleasure wetting my collar as we get close.",
      "I pick up the pace, reckless now. I don't care if they hear. I need to finish inside you.",
      "We don't care who hears anymore. The friction is too good, the risk too high, the pleasure too sharp.",
      "You let out a broken, high-pitched cry that definitely echoed in the hallway, giving us away.",
      "I cover your mouth with my hand instantly, muffling the rest of your climax as you shake apart.",
      "You come hard, spasm against my palm, your body going limp in my arms, completely spent.",
      "I empty myself inside you, groaning into your hair, shaking from the adrenaline and the release.",
      "We stand there, panting, disheveled, listening for any reaction from outside, hearts pounding.",
      "I fix your skirt, smoothing it down, kissing your flushed cheek. 'Good girl,' I whisper.",
      "We walk back out like nothing happened, though your hair is messy and lips swollen and red.",
      "But you're limping slightly. I can see it. And I know everyone else can see it too.",
      "People are staring. They know exactly what we just did in there, and they are jealous.",
      "I smirk at you across the table, watching you squirm in your seat.",
      "Say Yes and we finish this right here."
    ],
    yes: [
      "Keep looking.", "Touch me.", "Nervous.", "Higher.", "Hide it.",
      "Rub me.", "Straight face.", "Brush it.", "Tell me.", "Biting.",
      "Other leg.", "Squeeze.", "Let's go.", "Stumble.", "Lock it.",
      "Hike it.", "Naughty.", "Push me.", "Devour me.", "Touch it.",
      "Quiet.", "Gag me.", "Pump me.", "Shaking.", "Hush.",
      "Listen.", "Suck it.", "Deep throat.", "Lift me.", "Thrust.",
      "Bite you.", "Silently.", "Knock it.", "Danger.", "Pulsing.",
      "Distract me.", "Sobbing.", "Reckless.", "Don't care.", "Cry out.",
      "Cover me.", "Spasm.", "Empty.", "Panting.", "Fix me.",
      "Nothing happened.", "Limping.", "Staring.", "Smirk.", "Finish it."
    ]
  }
];

const App: React.FC = () => {
  // --- State ---
  const [gameState, setGameState] = useState<GameState>('intro');
  const [rejectionCount, setRejectionCount] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false); 
  const [shakeIntensity, setShakeIntensity] = useState(0);
  
  // Pick a random story on mount
  const [storyIndex, setStoryIndex] = useState(() => Math.floor(Math.random() * STORIES.length));
  
  // Physics State
  const yesPos = useRef<Vector2>({ x: 0, y: 0 }); 
  const noPos = useRef<Vector2>({ x: 0, y: 0 });
  
  // Visual State
  const [, setTick] = useState(0); 
  const [particles, setParticles] = useState<Particle[]>([]);
  
  // Derived
  const currentStory = STORIES[storyIndex];

  // --- Initialization ---
  useEffect(() => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    yesPos.current = { x: cx - BUTTON_WIDTH - 20, y: cy + 50 };
    noPos.current = { x: cx + 20, y: cy + 50 };
  }, []);

  // --- Game Loop ---
  useEffect(() => {
    let animationFrameId: number;

    const loop = () => {
      if (gameState === 'won') {
        updateParticles();
        setTick(t => t + 1);
        animationFrameId = requestAnimationFrame(loop);
        return;
      }

      // Physics removed for "Steady No".
      // We keep the loop for particles and shake decay.

      // Shake Decay
      if (shakeIntensity > 0) {
        setShakeIntensity(prev => Math.max(0, prev - 1));
      }

      updateParticles();
      setTick(t => t + 1);
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, shakeIntensity]);

  const updateParticles = () => {
    setParticles(prev => prev.map(p => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + 0.15,
      life: p.life - 0.02
    })).filter(p => p.life > 0));
  };

  const spawnExplosion = (x: number, y: number, color: string, useEmojis = false) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const angle = randomRange(0, Math.PI * 2);
      const speed = randomRange(4, 12);
      const isEmoji = useEmojis && Math.random() > 0.6; 
      
      newParticles.push({
        id: Date.now() + i,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        color: color,
        size: isEmoji ? 28 : randomRange(3, 8),
        content: isEmoji ? randomChoice((['💋', '🔥', '💦', '🍑', '⛓️', '🍆', '👅', '🩸'])) : undefined
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  };

  // --- Handlers ---

  const handleEnter = () => {
    setGameState('asking');
    playSound('heartbeat');
  };

  const handleStartOver = () => {
    setGameState('intro');
    setRejectionCount(0);
    setIsFlipped(false);
    setShakeIntensity(0);
    setParticles([]);
    
    // Pick a new story
    setStoryIndex(Math.floor(Math.random() * STORIES.length));
    
    // Reset positions
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    yesPos.current = { x: cx - BUTTON_WIDTH - 20, y: cy + 50 };
    noPos.current = { x: cx + 20, y: cy + 50 };
  };

  const handleNoClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isFlipped) {
      handleFinalAccept();
      return;
    }

    const newCount = rejectionCount + 1;
    setRejectionCount(newCount);

    // Creeping Yes: Move Yes button closer to No button (center) with each click
    yesPos.current.x += 2; // Moves right by 2px per click

    // Check if we reached the final step
    // FINAL_REVEAL_AT = 49.
    // If newCount is 49 (Index 48), we flip.
    if (newCount >= FINAL_REVEAL_AT) {
      setIsFlipped(true);
      spawnExplosion(e.clientX, e.clientY, '#FFD700'); 
      playSound('climax'); 
      return;
    }

    // Rejection Visuals
    setShakeIntensity(10 + newCount * 2); // Increased shake since it doesn't move
    playSound('heartbeat');
    spawnExplosion(e.clientX, e.clientY, '#8a1c28', true); 
  };

  const handleYesClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFlipped || rejectionCount >= FINAL_REVEAL_AT) {
      handleFinalAccept();
    } else {
      handlePrematureClickWithText(e.clientX, e.clientY);
    }
  };

  const handlePrematureClick = (x: number, y: number) => {
     spawnExplosion(x, y, '#FDF6E3', true); 
     playSound('thud');
  };

  const handleFinalAccept = () => {
    setGameState('won');
    playSound('climax');
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    spawnExplosion(cx, cy, '#FFD700', true);
    spawnExplosion(cx - 100, cy - 50, '#FF4444', true);
    spawnExplosion(cx + 100, cy - 50, '#FF4444', true);
  };

  // --- Visual Calculations ---
  
  // Calculate intensity (0 to 1)
  const intensity = Math.min(1, rejectionCount / FINAL_REVEAL_AT);
  
  // Screen shake style
  const shakeStyle = shakeIntensity > 0 ? {
    transform: `translate(${randomRange(-shakeIntensity, shakeIntensity)}px, ${randomRange(-shakeIntensity, shakeIntensity)}px)`
  } : {};

  // Dynamic Background: Velvet (#2a0a12) -> Blood Red (#4a0000)
  const bgOverlayOpacity = intensity * 0.95;
  
  // Text Content
  const getDisplayText = () => {
    if (rejectionCount === 0) return "Will you be my Valentine?";
    
    // Adjust index because 0 is taken by the intro
    const storyIdx = rejectionCount - 1;
    
    if (storyIdx === 0) {
        // First line of story - add bridge
        const rawText = currentStory.no[0];
        // Lowercase first letter if it's not "I"
        const formattedText = rawText.startsWith("I ") ? rawText : rawText.charAt(0).toLowerCase() + rawText.slice(1);
        
        let introContext = "";
        switch(currentStory.id) {
            case 'sensual': introContext = "Don't want to? Imagine this: "; break;
            case 'dominant': introContext = "Resisting? Imagine this: "; break;
            case 'shower': introContext = "Cold feet? Imagine this: "; break;
            case 'massage': introContext = "Tense? Imagine this: "; break;
            case 'teasing': introContext = "Shy? Imagine this: "; break;
            default: introContext = "Don't want to? Imagine this: ";
        }
        return introContext + formattedText;
    }
    
    if (storyIdx < currentStory.no.length) {
        return currentStory.no[storyIdx];
    }
    
    return currentStory.no[currentStory.no.length - 1];
  };

  const [transientYesMessage, setTransientYesMessage] = useState<string | null>(null);
  
  // Wrap handlePremature to set message
  const handlePrematureClickWithText = (x: number, y: number) => {
    handlePrematureClick(x, y);
    
    // Default message for Step 0 (Intro)
    if (rejectionCount === 0) {
        setTransientYesMessage("Not yet. The ritual has just begun.");
    } else {
        const storyIdx = rejectionCount - 1;
        const msg = currentStory.yes[Math.min(storyIdx, currentStory.yes.length - 1)];
        setTransientYesMessage(msg);
    }
    
    setTimeout(() => setTransientYesMessage(null), 2000);
  }

  // Abstract Body Silhouettes (SVG Paths)
  const SILHOUETTES = [
    "M10,10 Q50,100 90,50 T150,90", 
    "M10,50 Q50,0 90,50 T170,50",
    "M10,50 Q40,10 70,50 T130,50",
  ];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#2a0a12] text-white selection:bg-rose-500 selection:text-white transition-colors duration-1000">
      
      {/* Dynamic Red Overlay for Intensity */}
      <div 
        className="absolute inset-0 bg-[#600000] pointer-events-none transition-opacity duration-500 ease-in-out"
        style={{ opacity: bgOverlayOpacity }}
      />

      {/* Background Silhouettes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        {[...Array(6)].map((_, i) => (
            <svg 
                key={i} 
                className="absolute text-rose-900/40 fill-current animate-float"
                style={{
                    left: `${(i * 20) + Math.random() * 10}%`,
                    top: `${Math.random() * 80}%`,
                    width: '300px',
                    height: '300px',
                    transform: `rotate(${Math.random() * 360}deg) scale(${1 + intensity})`,
                    animationDuration: `${10 + Math.random() * 10}s`,
                    opacity: 0.1 + (intensity * 0.4) 
                }}
                viewBox="0 0 200 200"
            >
                <path d={SILHOUETTES[i % SILHOUETTES.length]} stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
        ))}
      </div>

      {/* Vignette */}
      <div 
        className="absolute inset-0 pointer-events-none transition-all duration-1000"
        style={{
            background: `radial-gradient(circle at center, transparent ${100 - (intensity * 60)}%, black 100%)`
        }}
      />

      <Explosion particles={particles} />

      {/* Main UI */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center pointer-events-none" style={shakeStyle}>
        
        {/* Intro Screen */}
        {gameState === 'intro' && (
           <div className="text-center pointer-events-auto cursor-pointer animate-pulse-slow p-8 sm:p-12 glass-panel rounded-full hover:bg-rose-900/20 transition-colors mx-4"
                onClick={handleEnter}>
             <h1 className="font-cinzel text-3xl sm:text-4xl md:text-6xl text-gold mb-4 tracking-widest drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]">
               A Dark Proposal
             </h1>
             <p className="font-montserrat text-rose-200 text-xs sm:text-sm tracking-[0.3em] uppercase opacity-80">
               Click to Begin
             </p>
           </div>
        )}

        {/* Game Screen Text */}
        {gameState === 'asking' && (
          <div className="absolute top-[15%] w-full text-center transition-all duration-300 px-3 sm:px-4">
             <h2 
                className="font-playfair text-lg sm:text-2xl md:text-4xl lg:text-5xl text-white mb-6 drop-shadow-lg leading-tight mx-auto max-w-4xl"
                style={{
                    animation: `pulse ${4 - (intensity * 3.5)}s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
                    transform: `scale(${1 + intensity * 0.2})`
                }}
             >
              {transientYesMessage || getDisplayText()}
             </h2>
             <p className="font-montserrat text-gold/60 text-xs tracking-widest uppercase mt-6 sm:mt-8 opacity-50">
               {isFlipped ? "SURRENDER" : ""}
             </p>
          </div>
        )}

        {/* Victory Screen */}
        {gameState === 'won' && (
          <div className="text-center animate-float glass-panel p-6 sm:p-10 rounded-2xl max-w-2xl mx-4 pointer-events-auto z-50">
            <h1 className="font-cinzel text-4xl sm:text-5xl md:text-7xl text-gold mb-6 drop-shadow-[0_0_15px_rgba(212,175,55,0.8)]">
              OWNED
            </h1>
            <p className="font-playfair text-base sm:text-xl md:text-2xl text-rose-200 italic mb-8">
              "Finally. Now, strip and show me."
            </p>
            <button 
              onClick={handleStartOver}
              className="mt-6 sm:mt-8 px-4 sm:px-6 py-2 border border-rose-900/50 text-rose-900/50 hover:text-rose-500 hover:border-rose-500 transition-colors text-xs rounded-full"
            >
              Start Over
            </button>
          </div>
        )}
      </div>

      {/* BUTTONS CONTAINER */}
      {(gameState === 'asking' || gameState === 'won') && gameState !== 'won' && (
        <div style={shakeStyle} className="absolute inset-0 pointer-events-none">
          {/* --- YES BUTTON --- */}
          <div
             className="absolute perspective-1000 z-30 pointer-events-auto"
             style={{
               left: yesPos.current.x,
               top: yesPos.current.y,
               width: BUTTON_WIDTH,
               height: BUTTON_HEIGHT,
               transition: 'left 0.1s linear' // Smooth creep
             }}
           >
             <div 
               className="relative w-full h-full transform-style-3d cursor-pointer"
               onClick={(e) => isFlipped ? handleYesClick(e) : handlePrematureClickWithText(e.clientX, e.clientY)}
             >
               <div className="absolute inset-0 backface-hidden flex items-center justify-center bg-rose-700 rounded-lg shadow-[0_0_20px_rgba(234,28,72,0.4)] hover:scale-105 transition-transform">
                 <span className="font-cinzel font-bold text-white tracking-wider text-sm sm:text-base">YES</span>
               </div>
             </div>
          </div>
         

          {/* --- NO BUTTON --- */}
          <div
              className="absolute perspective-1000 z-40 pointer-events-auto"
              style={{
                left: noPos.current.x,
                top: noPos.current.y,
                width: BUTTON_WIDTH,
                height: BUTTON_HEIGHT,
              }}
            >
             <div 
               className={`relative w-full h-full transition-transform duration-700 transform-style-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
               onClick={handleNoClick}
             >
                {/* FRONT: NO */}
                <div className="absolute inset-0 backface-hidden flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-colors">
                  <span className="font-cinzel font-bold text-gray-400 hover:text-red-400 tracking-wider text-sm sm:text-base">NO</span>
                </div>

                {/* BACK: YES (Flipped State) */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 flex items-center justify-center bg-gold rounded-lg shadow-[0_0_30px_rgba(212,175,55,0.6)]">
                  <span className="font-cinzel font-bold text-black tracking-widest text-base sm:text-lg">YES</span>
                </div>
             </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 right-4 text-white/10 font-cinzel text-xs pointer-events-none">
        The Ritual
      </div>
    </div>
  );
};

export default App;