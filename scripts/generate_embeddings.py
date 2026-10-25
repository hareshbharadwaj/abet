"""
A2ZEE Microgreens & Sprouts - SBERT Vector Embeddings Generator
Uses sentence-transformers ('all-MiniLM-L6-v2') to compute 384-dimensional vector embeddings
for all catalogue products, wellness ranges, and curated boxes.
Ground truth source: src/app/components/catalogueData.ts
"""

import json
import os
import sys

# Ensure UTF-8 output on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def main():
    print("[SBERT] Initializing Sentence-Transformers all-MiniLM-L6-v2...")
    try:
        from sentence_transformers import SentenceTransformer
        import numpy as np
    except ImportError:
        print("[ERROR] sentence-transformers or numpy not yet available. Run 'pip install sentence-transformers numpy' first.")
        sys.exit(1)

    model = SentenceTransformer('all-MiniLM-L6-v2')
    print("[OK] Model loaded successfully: all-MiniLM-L6-v2 (Embedding dimension: 384)")

    # Products & Curated Boxes from catalogueData.ts
    items = [
        # --- RANGE 01: Protein & Energy Builders ---
        {
            "id": "mc-01",
            "type": "product",
            "name": "Green Gram",
            "tamilName": "பாசிப்பயறு",
            "range": "Protein & Energy Builders",
            "subtitle": "Sweet, crisp, juicy",
            "description": "Our best-selling everyday green — highest plant protein in the range, with fibre for digestion and folate for daily energy. Ideal for muscle building, gym, stamina, children and vegetarian protein.",
            "keyNutrients": ["Protein", "Fibre", "Vit C", "Folate", "Iron"],
            "prices": {"50g": 50, "100g": 100},
            "priceText": "₹50 (50g) / ₹100 (100g)",
            "image": "/greengram.png",
            "bestFor": "Growing children, gym and sports nutrition, muscle stamina, vegetarian households"
        },
        {
            "id": "mc-02",
            "type": "product",
            "name": "Black Gram",
            "tamilName": "உளுந்து",
            "range": "Protein & Energy Builders",
            "subtitle": "Mild, nutty, tender",
            "description": "The classic Tamil strength food in its most nutrient-dense form — protein, iron and calcium for stamina and bone support.",
            "keyNutrients": ["Protein", "Iron", "Calcium", "B-Vitamins"],
            "prices": {"50g": 50, "100g": 100},
            "priceText": "₹50 (50g) / ₹100 (100g)",
            "image": "/blackgram.png",
            "bestFor": "Stamina, bone health, post-workout, traditional nutrition"
        },
        {
            "id": "mc-03",
            "type": "product",
            "name": "Horse Gram",
            "tamilName": "கொள்ளு",
            "range": "Protein & Energy Builders",
            "subtitle": "Earthy, gently bitter",
            "description": "Long valued in Siddha kitchens for warmth and weight management; rich in fibre, iron, protein and protective polyphenols.",
            "keyNutrients": ["Protein", "Fibre", "Iron", "Polyphenols"],
            "prices": {"50g": 60, "100g": 120},
            "priceText": "₹60 (50g) / ₹120 (100g)",
            "image": "/horse_gram.png",
            "bestFor": "Weight loss, metabolism boost, Siddha warmth, kidney & digestion support"
        },
        {
            "id": "mc-04",
            "type": "product",
            "name": "Peas",
            "tamilName": "பட்டாணி",
            "range": "Protein & Energy Builders",
            "subtitle": "Sweet, succulent, crunchy",
            "description": "The sweetest shoot we grow and the easiest way to get children eating greens — protein plus vitamins A, C and K. Highly succulent.",
            "keyNutrients": ["Protein", "Vit A", "Vit C", "Vit K"],
            "prices": {"50g": 150, "100g": 300},
            "priceText": "₹150 (50g) / ₹300 (100g)",
            "image": "/pea_shoots.png",
            "bestFor": "Children meals, sweet salads, delicate plating, protein & vitamins"
        },

        # --- RANGE 02: Heart & Omega-3 Care ---
        {
            "id": "mc-05",
            "type": "product",
            "name": "Flax",
            "tamilName": "ஆளி விதை",
            "range": "Heart & Omega-3 Care",
            "subtitle": "Mild, nutty, soft",
            "description": "A leading plant source of omega-3 ALA and lignans, with fibre and vitamin E — a simple daily addition for heart care and cholesterol balance.",
            "keyNutrients": ["Omega-3", "Fibre", "Vit E", "Lignans"],
            "prices": {"50g": 100, "100g": 200},
            "priceText": "₹100 (50g) / ₹200 (100g)",
            "image": "/Flax.png",
            "bestFor": "Heart health, blood pressure, cholesterol management, anti-inflammatory"
        },
        {
            "id": "mc-06",
            "type": "product",
            "name": "Chia",
            "tamilName": "சியா விதை",
            "range": "Heart & Omega-3 Care",
            "subtitle": "Mildly bitter, minty",
            "description": "Omega-3, calcium and antioxidants in one delicate green — associated with bone, brain and cardiovascular wellness.",
            "keyNutrients": ["Omega-3", "Calcium", "Fibre", "Antioxidants"],
            "prices": {"50g": 100, "100g": 200},
            "priceText": "₹100 (50g) / ₹200 (100g)",
            "image": "/chia.png",
            "bestFor": "Cardiovascular wellness, cognitive focus, brain health, bone strength"
        },
        {
            "id": "mc-07",
            "type": "product",
            "name": "Sesame",
            "tamilName": "எள்",
            "range": "Heart & Omega-3 Care",
            "subtitle": "Nutty with a bitter finish",
            "description": "One of the most calcium-rich greens available, with iron, vitamin E and good fats for heart and bone strength.",
            "keyNutrients": ["Calcium", "Iron", "Vit E", "Good fats"],
            "prices": {"50g": 75, "100g": 150},
            "priceText": "₹75 (50g) / ₹150 (100g)",
            "image": "/Sesame.png",
            "bestFor": "Calcium deficiency, bone density, healthy fats, heart care"
        },
        {
            "id": "mc-08",
            "type": "product",
            "name": "Sunflower",
            "tamilName": "சூரியகாந்தி",
            "range": "Heart & Omega-3 Care",
            "subtitle": "Big crunch, sweet and nutty",
            "description": "The chef's favourite for texture — thick, juicy stems loaded with vitamin E, zinc and B-complex for glowing skin and heart vitality.",
            "keyNutrients": ["Vit E", "Zinc", "Protein", "B-Vitamins"],
            "prices": {"50g": 150, "100g": 300},
            "priceText": "₹150 (50g) / ₹300 (100g)",
            "image": "/Sunflower.png",
            "bestFor": "Crunchy salads, skin glow, zinc immunity, chef plating"
        },

        # --- RANGE 03: Blood Sugar & Weight Management ---
        {
            "id": "mc-09",
            "type": "product",
            "name": "Fenugreek",
            "tamilName": "வெந்தயம்",
            "range": "Blood Sugar & Weight Management",
            "subtitle": "Pleasantly bitter, aromatic",
            "description": "Traditionally used to support blood-sugar balance, insulin sensitivity, and digestion; rich in vitamins A, C, K, iron and fibre.",
            "keyNutrients": ["Vit A", "Vit C", "Vit K", "Iron", "Fibre"],
            "prices": {"50g": 50, "100g": 100},
            "priceText": "₹50 (50g) / ₹100 (100g)",
            "image": "/Fenugreek.png",
            "bestFor": "Diabetes management, blood sugar control, gut digestion, hormonal balance"
        },
        {
            "id": "mc-10",
            "type": "product",
            "name": "Ragi",
            "tamilName": "கேழ்வரகு",
            "range": "Blood Sugar & Weight Management",
            "subtitle": "Fresh, grassy, lightly sweet",
            "description": "Tamil Nadu's calcium staple as a living green — slow release energy with iron, fibre and amino acids without blood sugar spikes.",
            "keyNutrients": ["Calcium", "Iron", "Fibre", "Amino acids"],
            "prices": {"50g": 75, "100g": 150},
            "priceText": "₹75 (50g) / ₹150 (100g)",
            "image": "/Ragi.png",
            "bestFor": "Slow glycemic release, sustained energy, bone density, diabetes diet"
        },
        {
            "id": "mc-11",
            "type": "product",
            "name": "Pearl Millet",
            "tamilName": "கம்பு",
            "range": "Blood Sugar & Weight Management",
            "subtitle": "Sweet, grassy, cooling",
            "description": "A cooling millet green with iron, magnesium and fibre — steady energy without the sugar spike of refined grains.",
            "keyNutrients": ["Iron", "Magnesium", "Fibre", "B-Vitamins"],
            "prices": {"50g": 75, "100g": 150},
            "priceText": "₹75 (50g) / ₹150 (100g)",
            "image": "/Pearl Millet.png",
            "bestFor": "Body cooling, digestion, steady metabolic energy, magnesium support"
        },
        {
            "id": "mc-12",
            "type": "product",
            "name": "Alfalfa",
            "tamilName": "அல்ஃபால்ஃபா",
            "range": "Blood Sugar & Weight Management",
            "subtitle": "Delicate, fresh, very mild",
            "description": "The classic sandwich green — feather-light, low in calories and generous in vitamins C, K and folate. Great for weight loss diets.",
            "keyNutrients": ["Vit C", "Vit K", "Folate", "Saponins"],
            "prices": {"50g": 150, "100g": 300},
            "priceText": "₹150 (50g) / ₹300 (100g)",
            "image": "/Alfalfa.png",
            "bestFor": "Weight loss, low calorie diets, sandwiches, natural detoxification"
        },

        # --- RANGE 04: Immunity, Eye & Skin Defence ---
        {
            "id": "mc-13",
            "type": "product",
            "name": "Mustard",
            "tamilName": "கடுகு",
            "range": "Immunity, Eye & Skin Defence",
            "subtitle": "Sharp and peppery, wasabi-like",
            "description": "A true multivitamin leaf carrying vitamins A, B6, B9, C, E and K — linked with eye, brain and immune support. Spicy wasabi kick.",
            "keyNutrients": ["Vit A", "Vit B6", "Vit C", "Vit E", "Vit K"],
            "prices": {"50g": 75, "100g": 150},
            "priceText": "₹75 (50g) / ₹150 (100g)",
            "image": "/Mustard.png",
            "bestFor": "Immune defence, colds, sinus clearance, sharp peppery seasoning"
        },
        {
            "id": "mc-14",
            "type": "product",
            "name": "White Radish",
            "tamilName": "முள்ளங்கி",
            "range": "Immunity, Eye & Skin Defence",
            "subtitle": "Zesty, hot, peppery",
            "description": "Bold flavour with vitamin C, folate and sulphur antioxidants — the star of chaats, salads and sandwiches. Clears respiratory congestion.",
            "keyNutrients": ["Vit C", "Vit A", "Folate", "Antioxidants"],
            "prices": {"50g": 150, "100g": 300},
            "priceText": "₹150 (50g) / ₹300 (100g)",
            "image": "/radish.png",
            "bestFor": "Digestion, liver detox, Vitamin C immune support, peppery salads"
        },
        {
            "id": "mc-15",
            "type": "product",
            "name": "Carrot",
            "tamilName": "கேரட்",
            "range": "Immunity, Eye & Skin Defence",
            "subtitle": "Sweet, feathery, aromatic",
            "description": "Fine lace-like fronds packed with beta-carotene for eye vision and skin health — and the prettiest garnish on the plate.",
            "keyNutrients": ["Beta-carotene", "Vit A", "Vit C", "Vit K"],
            "prices": {"50g": 150, "100g": 300},
            "priceText": "₹150 (50g) / ₹300 (100g)",
            "image": "/Carrot.png",
            "bestFor": "Eye health, vision, beta-carotene, skin glow, gourmet garnish"
        },
        {
            "id": "mc-16",
            "type": "product",
            "name": "Lettuce",
            "tamilName": "லெட்டியூஸ்",
            "range": "Immunity, Eye & Skin Defence",
            "subtitle": "Soft, buttery, mild",
            "description": "Our most tender premium salad base — gentle on the gut, generous in vitamins A, K and folate. Refreshing hydration.",
            "keyNutrients": ["Vit A", "Vit K", "Folate", "Fibre"],
            "prices": {"50g": 200, "100g": 400},
            "priceText": "₹200 (50g) / ₹400 (100g)",
            "image": "/Lettuce.png",
            "bestFor": "Gourmet salads, tender crunch, gut calming, premium dining"
        },
        {
            "id": "mc-17",
            "type": "product",
            "name": "Red Cowpea",
            "tamilName": "சிவப்பு காராமணி",
            "range": "Immunity, Eye & Skin Defence",
            "subtitle": "Crisp, mild, lightly beany",
            "description": "Striking crimson stems whose colour comes from anthocyanin antioxidants, with protein, iron and folate alongside.",
            "keyNutrients": ["Protein", "Iron", "Folate", "Anthocyanins"],
            "prices": {"50g": 75, "100g": 150},
            "priceText": "₹75 (50g) / ₹150 (100g)",
            "image": "/red_cowpea.png",
            "bestFor": "Anthocyanin cellular defence, blood building, vibrant red plating"
        },

        # --- RANGE 05: Iron, Blood & Detox Greens ---
        {
            "id": "mc-18",
            "type": "product",
            "name": "Garden Cress",
            "tamilName": "அலிவ் / ஹலீம்",
            "range": "Iron, Blood & Detox Greens",
            "subtitle": "Peppery, tangy, punchy",
            "description": "Our iron champion, traditionally given to new mothers — also carrying vitamins A, C, E, K and folate in abundance. Supreme haemoglobin booster.",
            "keyNutrients": ["Iron", "Folate", "Vit A", "Vit C", "Vit K"],
            "prices": {"50g": 200, "100g": 400},
            "priceText": "₹200 (50g) / ₹400 (100g)",
            "image": "/Garden Cress.png",
            "bestFor": "Anaemia, haemoglobin boost, postpartum recovery, iron deficiency, women wellness"
        },
        {
            "id": "mc-19",
            "type": "product",
            "name": "Wheatgrass",
            "tamilName": "கோதுமைப் புல்",
            "range": "Iron, Blood & Detox Greens",
            "subtitle": "Sweet, intensely grassy",
            "description": "The original daily detox shot — juice it fresh for chlorophyll, iron and vitamins A, C and E. Total body cleansing.",
            "keyNutrients": ["Chlorophyll", "Iron", "Vit A", "Vit C", "Vit E"],
            "prices": {"50g": 100, "100g": 200},
            "priceText": "₹100 (50g) / ₹200 (100g)",
            "image": "/Wheatgrass.png",
            "bestFor": "Daily detox juice shot, blood purification, deep chlorophyll cleansing"
        },
        {
            "id": "mc-20",
            "type": "product",
            "name": "Beetroot",
            "tamilName": "பீட்ரூட்",
            "range": "Iron, Blood & Detox Greens",
            "subtitle": "Earthy and sweet",
            "description": "Ruby-red stems supplying dietary nitrates associated with healthy circulation and stamina, plus iron and folate.",
            "keyNutrients": ["Nitrates", "Iron", "Folate", "Vit C"],
            "prices": {"50g": 150, "100g": 300},
            "priceText": "₹150 (50g) / ₹300 (100g)",
            "image": "/Beetroot.png",
            "bestFor": "Athletic endurance, nitric oxide circulation, blood pressure, vibrant colour"
        },
        {
            "id": "mc-21",
            "type": "product",
            "name": "Amaranthus",
            "tamilName": "முளைக்கீரை",
            "range": "Iron, Blood & Detox Greens",
            "subtitle": "Mild, earthy, soft",
            "description": "Our native keerai reborn as a microgreen — deep magenta leaves rich in iron, calcium and vitamins A and C.",
            "keyNutrients": ["Iron", "Calcium", "Vit A", "Vit C", "Protein"],
            "prices": {"50g": 150, "100g": 250},
            "priceText": "₹150 (50g) / ₹250 (100g)",
            "image": "/Amaranthus.png",
            "bestFor": "Traditional keerai nutrition, anaemia prevention, bone strength"
        },

        # --- RANGE 06: Fresh Sprouts ---
        {
            "id": "mc-22",
            "type": "product",
            "name": "Mung Bean Sprouts",
            "tamilName": "பாசிப்பயறு முளை",
            "range": "Fresh Sprouts",
            "subtitle": "Crisp, juicy, clean and mild • Korean sukjunamul",
            "description": "Plump, snappy sprouts grown in-house in RO water and harvested the same morning. Low in calories and fat but high in fibre, plant protein, vitamin C, folate and iron — Korean sukjunamul.",
            "keyNutrients": ["Vit C", "Folate", "Fibre", "Protein", "Iron"],
            "prices": {"500g": 200, "1kg": 350},
            "priceText": "₹200 (500g) / ₹350 (1kg)",
            "image": "/green_gram.png",
            "bestFor": "Stir-fries, Asian cuisine, Korean sukjunamul, budget family volume, salads"
        },

        # --- CURATED BOXES ---
        {
            "id": "box-01",
            "type": "curated_box",
            "name": "Everyday Family Box",
            "subtitle": "The daily basics, mild enough for children",
            "description": "A balanced selection of nutrient-rich staples that are mild and easy to incorporate into daily meals. Includes Green Gram, Black Gram, Ragi, Pearl Millet.",
            "keyNutrients": ["Protein", "Calcium", "Fibre", "Iron"],
            "itemsIncluded": ["Green Gram", "Black Gram", "Ragi", "Pearl Millet"],
            "prices": {"box": 250},
            "priceText": "₹250 (Full Kit)",
            "image": "/greengram.png",
            "bestFor": "Families with children, beginners to microgreens, everyday staple nutrition"
        },
        {
            "id": "box-02",
            "type": "curated_box",
            "name": "Heart & Vitality Box",
            "subtitle": "Omega-3, vitamin E and calcium in a single kit",
            "description": "Specially chosen varieties that promote cardiovascular wellness, containing seeds known for heart support. Includes Flax, Chia, Sesame, Sunflower.",
            "keyNutrients": ["Omega-3", "Vit E", "Calcium", "Zinc"],
            "itemsIncluded": ["Flax", "Chia", "Sesame", "Sunflower"],
            "prices": {"box": 425},
            "priceText": "₹425 (Full Kit)",
            "image": "/Flax.png",
            "bestFor": "Adults over 35, cholesterol control, cardiovascular health, omega-3 fatty acids"
        },
        {
            "id": "box-03",
            "type": "curated_box",
            "name": "Immunity & Detox Box",
            "subtitle": "Bold, high-antioxidant greens plus a juicing grass",
            "description": "Boost your defenses with highly purifying varieties and antioxidants to support natural detoxification. Includes Mustard, White Radish, Wheatgrass, Beetroot.",
            "keyNutrients": ["Chlorophyll", "Vit C", "Nitrates", "Antioxidants"],
            "itemsIncluded": ["Mustard", "White Radish", "Wheatgrass", "Beetroot"],
            "prices": {"box": 475},
            "priceText": "₹475 (Full Kit)",
            "image": "/Wheatgrass.png",
            "bestFor": "Detox, morning wellness shots, seasonal immune defence, sinus and liver cleanse"
        },
        {
            "id": "box-04",
            "type": "curated_box",
            "name": "Chef's Premium Salad Box",
            "subtitle": "Our finest textures and colours for the table",
            "description": "A vibrant mix of premium leaves and shoots that provide gorgeous presentation, crunch, and complex flavors. Includes Lettuce, Garden Cress, Carrot, Peas, Amaranthus.",
            "keyNutrients": ["Vit A", "Vit C", "Vit K", "Beta-carotene", "Iron"],
            "itemsIncluded": ["Lettuce", "Garden Cress", "Carrot", "Peas", "Amaranthus"],
            "prices": {"box": 850},
            "priceText": "₹850 (Full Kit)",
            "image": "/Lettuce.png",
            "bestFor": "Gourmet dining, luxury salads, aesthetic dinner parties, high culinary texture"
        },
        {
            "id": "box-05",
            "type": "curated_box",
            "name": "Sprout & Green Kitchen Box",
            "subtitle": "Bulk sprouts plus three everyday greens",
            "description": "Get a 500g bulk pack of mung bean sprouts along with three highly versatile everyday greens for cooking and salads. Includes 500g Mung Bean Sprouts, Green Gram, Fenugreek, Sunflower.",
            "keyNutrients": ["Protein", "Fibre", "Vit C", "Vit E"],
            "itemsIncluded": ["Mung Bean Sprouts (500g)", "Green Gram", "Fenugreek", "Sunflower"],
            "prices": {"box": 425},
            "priceText": "₹425 (Full Kit)",
            "image": "/green_gram.png",
            "bestFor": "Cooking households, Asian stir-fries, bulk sprout lovers, value bundle"
        }
    ]

    # Build semantic passage for each item to encode
    passages = []
    for item in items:
        passage = (
            f"Title: {item['name']} ({item.get('tamilName', '')}). "
            f"Category: {item.get('range', 'Curated Box')}. "
            f"Subtitle: {item.get('subtitle', '')}. "
            f"Description: {item['description']} "
            f"Nutrients: {', '.join(item.get('keyNutrients', []))}. "
            f"Best for: {item.get('bestFor', '')}. "
            f"Exact Price: {item['priceText']}."
        )
        passages.append(passage)

    print(f"[PROGRESS] Computing embeddings for {len(items)} catalogue items using all-MiniLM-L6-v2...")
    embeddings = model.encode(passages, convert_to_numpy=True, normalize_embeddings=True)

    # Attach embedding vector to each item
    output_items = []
    for idx, item in enumerate(items):
        item_copy = dict(item)
        item_copy["embedding"] = [round(float(val), 6) for val in embeddings[idx]]
        item_copy["searchPassage"] = passages[idx]
        output_items.append(item_copy)

    # Save to src/data/productEmbeddings.json
    output_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "src", "data")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "productEmbeddings.json")

    data = {
        "model": "sentence-transformers/all-MiniLM-L6-v2",
        "dimension": 384,
        "count": len(output_items),
        "items": output_items
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"[SUCCESS] Exported {len(output_items)} vector embeddings to {output_path}")

    # Run quick benchmark validation queries
    print("\n[BENCHMARK] --- SBERT Semantic Retrieval Benchmark ---")
    test_queries = [
        "What is best for building muscle and gym workouts?",
        "I need something to lower cholesterol and help my heart",
        "Greens for diabetes and blood sugar balance",
        "Something high in iron for anaemia and new mothers",
        "A family box for beginners"
    ]

    for q in test_queries:
        q_emb = model.encode([q], convert_to_numpy=True, normalize_embeddings=True)[0]
        # Cosine similarity is dot product when vectors are normalized
        sims = np.dot(embeddings, q_emb)
        top_idx = int(np.argmax(sims))
        top_item = items[top_idx]
        score = float(sims[top_idx])
        print(f"Query: \"{q}\"")
        print(f"  -> Top Match: {top_item['name']} ({top_item['priceText']}) [Score: {score:.4f}]")
        print(f"     Key Nutrients: {', '.join(top_item['keyNutrients'])}")

if __name__ == "__main__":
    main()
