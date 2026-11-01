// src/data/grammarLessonsData.js
// SpellyCraft: IELTS Academic Grammar Curriculum (Band 7.5 - 9.0)
// Designed for clear comprehension: Plain English explanations, zero confusing notation,
// modular chunked sections, and realistic IELTS Academic examples.

export const GRAMMAR_LESSONS = [
  {
    id: "parallelism",
    title: "Parallelism & Balanced Sentences",
    category: "sentence-structure",
    corePrinciple:
      "Parallelism means keeping words, phrases, and items in a list in the exact same grammatical shape. If your sentence lists three actions, all three should share the same pattern (for example, all '-ing' words or all 'to' verbs). When you mix different forms in the same sentence, the sentence feels awkward, unbalanced, and difficult to read.",
    ieltsImpact:
      "In IELTS Writing (Grammatical Range and Accuracy), examiners look for clear, balanced sentences that are free of errors. When your lists or paired phrases don't match, your writing sounds clumsy, which keeps your score around Band 6.0. Using smooth, balanced sentences makes your ideas clear and boosts your score to Band 8.0 and above.",
    l1Trap:
      "Many languages connect ideas by meaning alone, so mixing different verb forms feels natural to non-native speakers. In English, you must consciously check that every item in a list shares the exact same pattern (for example: 'reading, writing, and speaking' — not 'reading, to write, and speech').",
    formula: `Rule 1: Matching Lists of Words or Actions
• Pattern: Item 1 + Item 2 + and + Item 3 (All must share the same form)
• Good: "The course teaches reading, writing, and speaking." (All are -ing words)
• Avoid: "The course teaches reading, to write, and speech." (Mixed forms)

Rule 2: Paired Words (Either... or / Neither... nor / Both... and)
• Pattern: Word 1 + [Action A] + Word 2 + [Action B in the exact same form]
• Good: "Students must either attend the lecture or submit an assignment."
• Avoid: "Students must either attend the lecture or an assignment must be submitted."

Rule 3: Not Only... But Also
• Pattern: Not only [Action A], but also [Action B]
• Good: "Regular exercise not only improves physical health, but also reduces stress."
• Avoid: "Regular exercise not only improves physical health, but it is also good for stress."`,
    keyTerms: [
      {
        term: "Parallel Structure",
        definition:
          "Using the same grammatical pattern for two or more words, phrases, or clauses in a sentence.",
      },
      {
        term: "Coordinating Conjunction",
        definition:
          "Simple connecting words like 'and', 'but', and 'or' that link equal parts of a sentence.",
      },
      {
        term: "Paired Conjunctions",
        definition:
          "Pairs of connecting words like 'either... or', 'neither... nor', and 'not only... but also' that work as a team.",
      },
      {
        term: "Gerund (-ing form)",
        definition:
          "A verb ending in '-ing' used as an action noun (such as: 'swimming is healthy').",
      },
      {
        term: "Infinitive (to + verb)",
        definition:
          "The basic form of a verb preceded by 'to' (such as: 'to study', 'to improve').",
      },
      {
        term: "Series / List",
        definition:
          "Three or more items joined together in a single sentence using commas and 'and'.",
      },
    ],
    workedExamples: [
      {
        original:
          "Rapid urban growth has forced city councils to expand bus routes, investing in housing, and the regulation of car emissions.",
        issue:
          "The three actions use three completely different patterns: 'to expand' (infinitive), 'investing' (-ing word), and 'the regulation' (noun phrase). This breaks the balance of the list.",
        ruleApplied:
          "List Balance: Every item governed by 'forced to' must use the same form. Use 'to' verbs for all three actions.",
        corrected:
          "Rapid urban growth has forced city councils to expand bus routes, to invest in housing, and to regulate car emissions.",
        explanation:
          "All three actions now share the same 'to + verb' pattern. The sentence reads smoothly and sounds natural to the examiner.",
      },
      {
        original:
          "The government's new policy was designed not only to reduce waste, but also it creates green jobs.",
        issue:
          "After 'not only', the writer used 'to reduce waste' (infinitive), but after 'but also', they switched to a whole new clause ('it creates green jobs').",
        ruleApplied:
          "Paired Words: What follows 'not only' must match what follows 'but also'.",
        corrected:
          "The government's new policy was designed not only to reduce waste, but also to create green jobs.",
        explanation:
          "Now both halves use matching 'to' verbs ('to reduce' and 'to create'), creating perfect balance.",
      },
      {
        original:
          "The survey shows that young people prefer working remotely, flexible hours, and to choose their own projects.",
        issue:
          "The list mixes a verb phrase ('working remotely'), a noun phrase ('flexible hours'), and an infinitive ('to choose').",
        ruleApplied:
          "Use identical noun phrases or identical gerund phrases for every item in the list.",
        corrected:
          "The survey shows that young people prefer working remotely, having flexible hours, and choosing their own projects.",
        explanation:
          "All three items are now '-ing' phrases ('working', 'having', 'choosing'), making the sentence easy to follow.",
      },
      {
        original:
          "Online education is both convenient for students and it saves university resources.",
        issue:
          "'Both' is followed by an adjective ('convenient'), but 'and' is followed by a full sentence ('it saves resources').",
        ruleApplied:
          "Balance after 'both... and': Both parts must be adjectives or both parts must be verbs.",
        corrected:
          "Online education is both convenient for students and economical for universities.",
        explanation:
          "Now 'both' and 'and' are paired with matching adjectives ('convenient' and 'economical').",
      },
      {
        original:
          "Neither the proposed tax nor the existing subsidies has solved the housing crisis.",
        issue:
          "With 'neither... nor', the verb must agree with the subject closest to it. 'Subsidies' is plural, but the writer used the singular 'has'.",
        ruleApplied:
          "Nearest Subject Agreement: Match the verb to the nearest noun.",
        corrected:
          "Neither the proposed tax nor the existing subsidies have solved the housing crisis.",
        explanation:
          "'Have' correctly agrees with the plural noun 'subsidies', which sits right before the verb.",
      },
    ],
    contrastivePairs: [
      {
        incorrect:
          "The program aims to reduce carbon emissions and promoting green energy.",
        correct:
          "The program aims to reduce carbon emissions and promote green energy.",
        diffHighlight: "and promoting → and promote",
        explanation:
          "Both actions depend on 'aims to', so both must use the base verb: 'aims to reduce... and promote'.",
      },
      {
        incorrect:
          "Candidates must be good at problem-solving, communicate well, and organized.",
        correct:
          "Candidates must be skilled at problem-solving, strong in communication, and well-organized.",
        diffHighlight: "Mixed forms → All adjectives",
        explanation:
          "Mixing a noun, a verb, and an adjective confuses the reader. Make all three items adjectives describing the candidate.",
      },
      {
        incorrect:
          "Online shopping is not only faster than physical stores, but also you save money.",
        correct:
          "Online shopping is not only faster than physical stores, but also cheaper.",
        diffHighlight: "Clause switch → Matching adjectives",
        explanation:
          "Pair the adjective 'faster' with the matching adjective 'cheaper' after 'not only... but also'.",
      },
      {
        incorrect:
          "Many teenagers enjoy playing video games, watching movies, and to listen to music.",
        correct:
          "Many teenagers enjoy playing video games, watching movies, and listening to music.",
        diffHighlight: "and to listen → and listening",
        explanation:
          "The verb 'enjoy' takes '-ing' words. Keep all three hobbies in the '-ing' form.",
      },
    ],
    quickCheck: [
      {
        question:
          "Choose the sentence that has correct parallel structure:",
        options: [
          "She loves traveling, exploring new cultures, and to take photographs.",
          "She loves traveling, exploring new cultures, and taking photographs.",
          "She loves travel, exploring new cultures, and takes photographs.",
          "She loves traveling, exploration of cultures, and photography.",
        ],
        correctIndex: 1,
        explanation:
          "Option B keeps all three activities in the '-ing' form ('traveling', 'exploring', 'taking'), making it balanced and correct.",
      },
      {
        question:
          "Complete the sentence correctly: 'Neither the head teacher nor the assistants ______ in agreement with the new policy.'",
        options: ["is", "are", "was", "has been"],
        correctIndex: 1,
        explanation:
          "With 'neither... nor', the verb agrees with the closest noun. Since 'assistants' is plural, the plural verb 'are' is correct.",
      },
    ],
    identificationExercises: [
      {
        id: "id-par-1",
        prompt: "Which sentence contains an unbalanced (faulty parallel) list?",
        sentences: [
          {
            text: "Good city planning requires clean public transport, safe cycling lanes, and affordable public housing.",
            isError: false,
            explanation:
              "All three items are matching noun phrases: 'clean transport', 'safe lanes', and 'affordable housing'.",
          },
          {
            text: "High university tuition fees prevent students from finishing their degrees, gaining qualifications, and to find stable jobs.",
            isError: true,
            explanation:
              "The list starts with '-ing' verbs ('finishing', 'gaining') but suddenly switches to 'to find'. It should be 'and finding stable jobs'.",
          },
          {
            text: "The new renewable energy scheme is designed to lower energy bills and protect wildlife habitats.",
            isError: false,
            explanation:
              "Both verbs share the matching base form: 'to lower... and protect'.",
          },
        ],
      },
      {
        id: "id-par-2",
        prompt: "Which sentence contains an error with paired words (not only / but also)?",
        sentences: [
          {
            text: "The initiative not only raised substantial funds for the school, but it also united the local neighborhood.",
            isError: false,
            explanation:
              "Both halves contain matching past tense verbs ('raised funds' and 'united the neighborhood').",
          },
          {
            text: "Regular walking is both beneficial for cardiovascular health and it helps mental clarity.",
            isError: true,
            explanation:
              "After 'both' there is an adjective ('beneficial'), but after 'and' there is a full clause ('it helps'). It should be: 'both beneficial for health and helpful for mental clarity'.",
          },
          {
            text: "Students can either download the reading materials online or borrow them from the campus library.",
            isError: false,
            explanation:
              "Both options match: 'download the materials' and 'borrow them'.",
          },
        ],
      },
    ],
  },

  {
    id: "parts-of-speech",
    title: "Parts of Speech, Word Forms & Collocations",
    category: "morphology",
    corePrinciple:
      "Every English word belongs to a family: Noun (naming word), Verb (action word), Adjective (describing a noun), or Adverb (describing an action). Changing the ending of a word (like turning the verb 'decide' into the noun 'decision') allows you to express thoughts with variety. Using the wrong word form or unnatural word pairings makes sentences sound awkward.",
    ieltsImpact:
      "Examiners look closely at how accurately you choose word forms. In academic essays, high-scoring writers often turn simple actions into formal nouns (e.g. 'cars pollute the air' becomes 'air pollution caused by vehicles'). Misusing word forms (like using an adjective instead of an adverb) immediately lowers your accuracy score.",
    l1Trap:
      "In many languages, adjectives and adverbs share the same word. In English, you must add '-ly' when describing how an action is done (e.g. 'speak fluently', not 'speak fluent'). Another common trap is translating word pairs directly from your native language instead of using natural English combinations (e.g. say 'conduct research', not 'make research').",
    formula: `Rule 1: Adjectives vs. Adverbs
• Adjectives describe NOUNS: "A rapid increase in sales." ('rapid' describes 'increase')
• Adverbs describe VERBS or ACTIONS: "Sales increased rapidly." ('rapidly' describes 'increased')

Rule 2: Academic Noun Forms (Nominalization)
• Conversational: "People are consuming more sugar every year."
• Academic (Band 8+): "The higher consumption of sugar has caused health concerns."
• Notice how turning 'consume' into 'consumption' makes the sentence formal and concise.

Rule 3: Natural Word Combinations (Collocations)
• Say: "Conduct a study" (Avoid: "Make a study")
• Say: "Reach a conclusion" (Avoid: "Get a conclusion")
• Say: "Play a crucial role" (Avoid: "Do a crucial role")`,
    keyTerms: [
      {
        term: "Noun",
        definition:
          "A word that names a person, place, thing, or abstract idea (such as: 'student', 'city', 'education').",
      },
      {
        term: "Verb",
        definition:
          "A word that expresses an action, state of being, or event (such as: 'analyze', 'develop', 'grow').",
      },
      {
        term: "Adjective",
        definition:
          "A word that describes or gives more information about a noun (such as: 'significant change', 'economic factor').",
      },
      {
        term: "Adverb",
        definition:
          "A word that modifies a verb, adjective, or sentence, often ending in '-ly' (such as: 'increased dramatically').",
      },
      {
        term: "Collocation",
        definition:
          "Words that naturally and commonly appear together in English (such as: 'heavy traffic', 'profound impact').",
      },
      {
        term: "Nominalization",
        definition:
          "The process of turning a verb or adjective into a formal noun to create an academic tone (such as: 'grow' → 'growth').",
      },
    ],
    workedExamples: [
      {
        original:
          "The economy improved significant after the government invested in infrastructure.",
        issue:
          "'Significant' is an adjective, but here it describes the verb 'improved'. Describing a verb requires an adverb.",
        ruleApplied:
          "Add '-ly' to form an adverb when describing an action verb.",
        corrected:
          "The economy improved significantly after the government invested in infrastructure.",
        explanation:
          "'Significantly' accurately describes how the economy improved.",
      },
      {
        original:
          "Scientists did an experiment to measure the effect of sunlight on crop yield.",
        issue:
          "In formal academic English, scientists do not 'do' experiments; they 'conduct' or 'carry out' experiments.",
        ruleApplied:
          "Use standard academic collocations ('conduct an experiment', 'carry out research').",
        corrected:
          "Scientists conducted an experiment to measure the effect of sunlight on crop yield.",
        explanation:
          "Using 'conducted' creates an authentic academic tone appropriate for IELTS Writing.",
      },
      {
        original:
          "Because technology is developing so quick, educational institutions must update their curricula.",
        issue:
          "'Quick' is an adjective. Describing the verb 'is developing' requires the adverb 'quickly'.",
        ruleApplied:
          "Use adverbs ('quickly', 'rapidly') to modify verbs of change.",
        corrected:
          "Because technology is developing so quickly, educational institutions must update their curricula.",
        explanation:
          "The adverb 'quickly' correctly modifies the verb 'developing'.",
      },
      {
        original:
          "Many teenagers lack of awareness about healthy nutrition.",
        issue:
          "When 'lack' is used as a verb, it takes a direct object without 'of' ('teenagers lack awareness'). 'Lack of' is only used when 'lack' is a noun ('there is a lack of awareness').",
        ruleApplied:
          "Verb vs. Noun pattern: 'lack + noun' (verb) vs. 'a lack of + noun' (noun phrase).",
        corrected:
          "Many teenagers lack awareness about healthy nutrition.",
        explanation:
          "Removing 'of' correctly uses 'lack' as a transitive verb.",
      },
      {
        original:
          "The project was high successful due to the strong dedication of the volunteer team.",
        issue:
          "'High' is an adjective. Modifying the adjective 'successful' requires the adverb 'highly'.",
        ruleApplied:
          "Use adverbs of degree ('highly', 'extremely') before adjectives.",
        corrected:
          "The project was highly successful due to the strong dedication of the volunteer team.",
        explanation:
          "'Highly successful' is a natural and accurate academic collocation.",
      },
    ],
    contrastivePairs: [
      {
        incorrect:
          "University researchers made a comprehensive survey on consumer spending.",
        correct:
          "University researchers conducted a comprehensive survey on consumer spending.",
        diffHighlight: "made a survey → conducted a survey",
        explanation:
          "In academic writing, always pair 'survey' or 'study' with 'conducted', not 'made'.",
      },
      {
        incorrect:
          "The price of electric vehicles has dropped dramatical over the past five years.",
        correct:
          "The price of electric vehicles has dropped dramatically over the past five years.",
        diffHighlight: "dramatical → dramatically",
        explanation:
          "An adverb ending in '-ly' is required to describe the verb 'has dropped'.",
      },
      {
        incorrect:
          "Renewable energy plays an important effect on combating climate change.",
        correct:
          "Renewable energy has an important effect on combating climate change.",
        diffHighlight: "plays an effect → has an effect",
        explanation:
          "You 'play a role', but you 'have an effect' or 'have an impact'. Do not blend the two phrases.",
      },
      {
        incorrect:
          "Living in large cities is extreme stressful for low-income families.",
        correct:
          "Living in large cities is extremely stressful for low-income families.",
        diffHighlight: "extreme stressful → extremely stressful",
        explanation:
          "Use the adverb 'extremely' to describe the adjective 'stressful'.",
      },
    ],
    quickCheck: [
      {
        question:
          "Select the sentence that uses the correct word form:",
        options: [
          "The government responded prompt to the environmental emergency.",
          "The government responded promptly to the environmental emergency.",
          "The government responded promptness to the environmental emergency.",
          "The government responded with prompt to the environmental emergency.",
        ],
        correctIndex: 1,
        explanation:
          "'Promptly' is the adverb modifying the verb 'responded', making Option B correct.",
      },
      {
        question:
          "Choose the natural academic collocation to complete the sentence: 'Recent studies ______ that regular sleep improves memory retention.'",
        options: ["indicate", "make", "tell", "inform"],
        correctIndex: 0,
        explanation:
          "In academic writing, studies 'indicate', 'suggest', or 'demonstrate' findings.",
      },
    ],
    identificationExercises: [
      {
        id: "id-pos-1",
        prompt: "Which sentence contains an incorrect word form (adjective vs. adverb)?",
        sentences: [
          {
            text: "The industrial sector has expanded significantly over the last three decades.",
            isError: false,
            explanation:
              "'Significantly' is correctly used as an adverb modifying 'expanded'.",
          },
          {
            text: "Commuters can travel easy between cities thanks to the high-speed rail network.",
            isError: true,
            explanation:
              "'Easy' is an adjective. Describing the verb 'travel' requires the adverb 'easily' ('travel easily').",
          },
          {
            text: "Strict environmental regulations have led to measurable reductions in carbon output.",
            isError: false,
            explanation:
              "'Measurable' is correctly used as an adjective modifying the noun 'reductions'.",
          },
        ],
      },
      {
        id: "id-pos-2",
        prompt: "Which sentence contains an unnatural word combination (collocation error)?",
        sentences: [
          {
            text: "University researchers conducted extensive fieldwork across six rural provinces.",
            isError: false,
            explanation:
              "'Conducted fieldwork' is an authentic and standard academic collocation.",
          },
          {
            text: "Technological innovation plays a crucial role in modern healthcare systems.",
            isError: false,
            explanation:
              "'Plays a crucial role' is a natural and highly rewarded IELTS collocation.",
          },
          {
            text: "The committee made a conclusion after reviewing all the statistical evidence.",
            isError: true,
            explanation:
              "In English, one does not 'make a conclusion'; one 'reaches a conclusion' or 'draws a conclusion'.",
          },
        ],
      },
    ],
  },

  {
    id: "singular-plural-nouns",
    title: "Singular & Plural Nouns: Countable vs. Uncountable",
    category: "morphology",
    corePrinciple:
      "Nouns in English are either Countable (items you can count individually, like 'one book, two books') or Uncountable (ideas, materials, or collections, like 'water', 'information', 'advice'). Uncountable nouns never take 'a/an', never add an '-s' at the end, and always take a singular verb. Countable nouns must be made plural when talking about things in general.",
    ieltsImpact:
      "Noun-number errors are the single most common mistake in IELTS Academic essays. Writing words like 'informations', 'researches', 'equipments', or 'furnitures' immediately alerts the examiner that your grammar is inconsistent. Mastering these rules prevents easy point deductions.",
    l1Trap:
      "In languages like Chinese, Japanese, Bengali, and Hindi, nouns do not change form when pluralized. Additionally, some concepts that are countable in other languages (such as 'two advices' or 'many informations') are strictly uncountable in English.",
    formula: `Rule 1: Common Uncountable Nouns in IELTS (Never add -s!)
• Information (NOT informations) → Use: "much information" or "a piece of information"
• Research (NOT researches) → Use: "further research" or "studies"
• Advice (NOT advices) → Use: "sound advice" or "pieces of advice"
• Equipment (NOT equipments) → Use: "modern equipment"
• Evidence (NOT evidences) → Use: "compelling evidence"

Rule 2: Greek and Latin Academic Plurals
• Phenomenon (singular) → Phenomena (plural)
• Criterion (singular) → Criteria (plural)
• Analysis (singular) → Analyses (plural)

Rule 3: Subject-Verb Agreement
• Uncountable nouns take singular verbs: "The information IS accurate."
• Plural nouns take plural verbs: "These criteria ARE essential."`,
    keyTerms: [
      {
        term: "Countable Noun",
        definition:
          "A noun that can be counted as individual units and has both singular and plural forms (e.g. 'one student, five students').",
      },
      {
        term: "Uncountable (Mass) Noun",
        definition:
          "A noun referring to an indivisible mass, concept, or substance that cannot be made plural (e.g. 'evidence', 'pollution').",
      },
      {
        term: "Irregular Plural",
        definition:
          "A noun that does not form its plural by simply adding '-s' or '-es' (e.g. 'criterion' → 'criteria', 'child' → 'children').",
      },
      {
        term: "Collective Noun",
        definition:
          "A word that refers to a group of individuals treated as a single unit (e.g. 'committee', 'team', 'staff').",
      },
      {
        term: "Quantifier",
        definition:
          "A word used before a noun to express quantity, such as 'many' (for countable) or 'much' (for uncountable).",
      },
      {
        term: "Subject-Verb Agreement",
        definition:
          "The rule that singular subjects take singular verbs, and plural subjects take plural verbs.",
      },
    ],
    workedExamples: [
      {
        original:
          "The Internet provides users with numerous useful informations on almost every subject.",
        issue:
          "'Information' is an uncountable noun. It cannot have an '-s' at the end, and it cannot be modified by 'numerous'.",
        ruleApplied:
          "Use 'a great deal of information', 'a wealth of information', or 'valuable information'.",
        corrected:
          "The Internet provides users with a wealth of useful information on almost every subject.",
        explanation:
          "'Information' is now in its correct uncountable form without the incorrect '-s'.",
      },
      {
        original:
          "Several new researches indicate that regular physical exercise improves academic performance.",
        issue:
          "'Research' is uncountable in English. You cannot say 'several new researches'.",
        ruleApplied:
          "Use 'several new studies' or 'recent research indicates'.",
        corrected:
          "Recent research indicates that regular physical exercise improves academic performance.",
        explanation:
          "Using 'recent research' preserves the uncountable noun and pairs it with the singular verb 'indicates'.",
      },
      {
        original:
          "The primary criteria for awarding the university scholarship is academic excellence.",
        issue:
          "'Criteria' is the plural form of the noun. The singular form is 'criterion'. Using 'is' with 'criteria' is a mismatch.",
        ruleApplied:
          "Singular: criterion | Plural: criteria. Match with the appropriate singular or plural verb.",
        corrected:
          "The primary criterion for awarding the university scholarship is academic excellence.",
        explanation:
          "'Criterion' is correctly singular and matches the singular verb 'is'.",
      },
      {
        original:
          "Hospitals require advanced medical equipments to diagnose rare illnesses accurately.",
        issue:
          "'Equipment' is uncountable. Adding '-s' is a grammatical error.",
        ruleApplied:
          "Use 'equipment' without '-s' for all quantities.",
        corrected:
          "Hospitals require advanced medical equipment to diagnose rare illnesses accurately.",
        explanation:
          "'Equipment' is now correctly used as an uncountable noun.",
      },
      {
        original:
          "Global warming is a complex phenomena that requires international collaboration.",
        issue:
          "'Phenomena' is plural. The singular noun needed after 'a' is 'phenomenon'.",
        ruleApplied:
          "Singular: phenomenon | Plural: phenomena.",
        corrected:
          "Global warming is a complex phenomenon that requires international collaboration.",
        explanation:
          "'Phenomenon' matches the singular article 'a' and the singular verb 'is'.",
      },
    ],
    contrastivePairs: [
      {
        incorrect:
          "The professor gave us several helpful advices regarding our research project.",
        correct:
          "The professor gave us several helpful pieces of advice regarding our research project.",
        diffHighlight: "advices → pieces of advice",
        explanation:
          "'Advice' is uncountable. Use 'pieces of advice' or simply 'helpful advice'.",
      },
      {
        incorrect:
          "The economic datas was gathered from thirty different developing countries.",
        correct:
          "The economic data were gathered from thirty different developing countries.",
        diffHighlight: "datas was → data were",
        explanation:
          "'Data' is already plural; there is no word 'datas'. In formal academic English, it takes a plural verb.",
      },
      {
        incorrect:
          "The university purchased new computer hardwares for the science laboratories.",
        correct:
          "The university purchased new computer hardware for the science laboratories.",
        diffHighlight: "hardwares → hardware",
        explanation:
          "'Hardware' is an uncountable noun and never takes an '-s'.",
      },
      {
        incorrect:
          "There are many evidences that support the theory of plate tectonics.",
        correct:
          "There is substantial evidence that supports the theory of plate tectonics.",
        diffHighlight: "many evidences that support → substantial evidence that supports",
        explanation:
          "'Evidence' is uncountable. Use 'substantial evidence' with the singular verb 'is'.",
      },
    ],
    quickCheck: [
      {
        question:
          "Which of the following sentences correctly handles uncountable nouns?",
        options: [
          "The university has installed advanced laboratory equipments.",
          "The researchers gathered substantial evidence to support their claim.",
          "Students need reliable informations before choosing a degree course.",
          "She provided several helpful advices on preparing for the IELTS exam.",
        ],
        correctIndex: 1,
        explanation:
          "Option B is correct because 'evidence' is uncountable and accurately paired with 'substantial'.",
      },
      {
        question:
          "Complete the sentence with the correct singular or plural form: 'The evaluation committee agreed that every ______ had been satisfied.'",
        options: ["criteria", "criterion", "criterias", "criterions"],
        correctIndex: 1,
        explanation:
          "The word 'every' requires a singular noun. 'Criterion' is the correct singular form.",
      },
    ],
    identificationExercises: [
      {
        id: "id-noun-1",
        prompt: "Which sentence contains an incorrect plural or uncountable noun?",
        sentences: [
          {
            text: "Students can access digital library resources from any campus computer.",
            isError: false,
            explanation:
              "'Resources' is a regular countable noun used correctly in the plural.",
          },
          {
            text: "Government officials reviewed all the financial informations submitted by the bank.",
            isError: true,
            explanation:
              "'Information' is an uncountable noun. It should be 'all the financial information'.",
          },
          {
            text: "The survey investigated consumer spending patterns across multiple demographics.",
            isError: false,
            explanation:
              "'Patterns' is a countable noun used correctly in the plural form.",
          },
        ],
      },
      {
        id: "id-noun-2",
        prompt: "Which sentence contains an irregular plural noun error?",
        sentences: [
          {
            text: "Scientists have documented several unusual phenomena occurring in the upper atmosphere.",
            isError: false,
            explanation:
              "'Phenomena' is the correct plural of 'phenomenon'.",
          },
          {
            text: "The selection criteria for international scholarships have been updated this term.",
            isError: false,
            explanation:
              "'Criteria' is plural and correctly pairs with the plural verb 'have been'.",
          },
          {
            text: "Social media has created a new social phenomenas that sociologists are eager to study.",
            isError: true,
            explanation:
              "'A new social phenomenas' is incorrect. With the singular article 'a', it must be 'a new social phenomenon'.",
          },
        ],
      },
    ],
  },

  {
    id: "voice-change",
    title: "Active vs. Passive Voice & Objective Register",
    category: "voice-and-style",
    corePrinciple:
      "In Active Voice, the subject performs the action ('The government built the hospital'). In Passive Voice, the focus is on the action or the result ('The hospital was built in 2021'). In academic writing and IELTS essays, passive voice is commonly used to sound objective, formal, and scientific when who performed the action is either obvious or not important.",
    ieltsImpact:
      "Band 8.0+ writers balance both voices effectively. They use passive voice when describing processes, data collection, and formal trends to maintain an objective academic tone. However, they avoid making verbs passive when the verb does not take a direct object (e.g. writing 'the change was happened' instead of 'the change happened').",
    l1Trap:
      "Some English verbs cannot be made passive because they do not take a direct object. Non-native speakers frequently produce incorrect sentences such as: 'The accident was occurred' or 'The issue was appeared'. In English, you must say: 'The accident occurred' and 'The issue appeared'.",
    formula: `Rule 1: Forming the Passive Voice
• Formula: Form of "to be" + Past Participle (3rd form of the verb)
• Present Simple: is / are + done (e.g. "Data is analyzed every month.")
• Past Simple: was / were + done (e.g. "The law was enacted in 2022.")
• Modal Verbs: should / can / must + be + done (e.g. "Carbon emissions must be reduced.")

Rule 2: When to Use Passive Voice
• When the action matters more than who did it: "Renewable energy is widely utilized across the country."
• In academic processes and IELTS Task 1: "The raw tea leaves are harvested, washed, and dried."

Rule 3: Verbs that CANNOT be Passive (Never use 'was occurred')
• Occur, happen, exist, remain, disappear, arrive
• Good: "The breakthrough occurred in 2020."
• Avoid: "The breakthrough was occurred in 2020."`,
    keyTerms: [
      {
        term: "Active Voice",
        definition:
          "A sentence structure where the subject performs the action expressed by the verb (e.g. 'Researchers conducted the trial').",
      },
      {
        term: "Passive Voice",
        definition:
          "A sentence structure where the subject receives the action (e.g. 'The trial was conducted by researchers').",
      },
      {
        term: "Agent",
        definition:
          "The person, organization, or thing that performs the action in a passive sentence, usually introduced by 'by'.",
      },
      {
        term: "Transitive Verb",
        definition:
          "A verb that takes a direct object (e.g. 'develop software') and can therefore be made passive.",
      },
      {
        term: "Intransitive Verb",
        definition:
          "A verb that does not take an object (e.g. 'happen', 'occur', 'arrive') and can NEVER be used in the passive voice.",
      },
      {
        term: "Objective Academic Tone",
        definition:
          "A neutral, fact-focused style of writing that avoids personal pronouns like 'I' or 'we' by focusing on the action itself.",
      },
    ],
    workedExamples: [
      {
        original:
          "A sudden increase in energy costs was occurred during the harsh winter months.",
        issue:
          "'Occur' is an intransitive verb and cannot take an object. Intransitive verbs can never be used in the passive voice.",
        ruleApplied:
          "Use the active past tense ('occurred') instead of the incorrect passive ('was occurred').",
        corrected:
          "A sudden increase in energy costs occurred during the harsh winter months.",
        explanation:
          "The active form 'occurred' is standard and grammatically accurate.",
      },
      {
        original:
          "We can observe significant changes in consumer behavior over the last decade.",
        issue:
          "Using 'we can observe' sounds conversational. Academic writing favors an impersonal, objective structure.",
        ruleApplied:
          "Convert to passive voice: 'Significant changes... can be observed'.",
        corrected:
          "Significant changes in consumer behavior can be observed over the last decade.",
        explanation:
          "The passive structure removes the informal pronoun 'we' and emphasizes the findings.",
      },
      {
        original:
          "The unexpected problems were happened because of poor project coordination.",
        issue:
          "'Happen' is an intransitive verb. It cannot be made passive.",
        ruleApplied:
          "Use active voice for intransitive verbs of occurrence ('happened', 'arose').",
        corrected:
          "The unexpected problems happened because of poor project coordination.",
        explanation:
          "'Happened' correctly replaces the ungrammatical 'were happened'.",
      },
      {
        original:
          "The government should strictly enforce the new traffic laws to lower accident rates.",
        issue:
          "While grammatically correct, focusing on the law itself often reads more formally in essay thesis statements.",
        ruleApplied:
          "Modal passive: 'Modal + be + past participle' ('should be strictly enforced').",
        corrected:
          "The new traffic laws should be strictly enforced to lower accident rates.",
        explanation:
          "Focusing on 'The new traffic laws' creates an authoritative policy statement.",
      },
      {
        original:
          "The researchers were collected the water samples from three different rivers.",
        issue:
          "The writer mixed active and passive forms ('were collected' when the researchers were the ones doing the collecting).",
        ruleApplied:
          "Active voice: Subject + past tense verb + object ('Researchers collected samples').",
        corrected:
          "The researchers collected the water samples from three different rivers.",
        explanation:
          "Now the subject 'researchers' actively performs the action 'collected'.",
      },
    ],
    contrastivePairs: [
      {
        incorrect:
          "The dramatic economic downturn was happened shortly after the global crisis.",
        correct:
          "The dramatic economic downturn happened shortly after the global crisis.",
        diffHighlight: "was happened → happened",
        explanation:
          "'Happen' is an intransitive verb; it can never be used in the passive voice.",
      },
      {
        incorrect:
          "The new environmental regulations were disappeared after the election.",
        correct:
          "The new environmental regulations disappeared after the election.",
        diffHighlight: "were disappeared → disappeared",
        explanation:
          "'Disappear' cannot be made passive. Use the active past tense 'disappeared'.",
      },
      {
        incorrect:
          "You must preserve historical monuments for future generations.",
        correct:
          "Historical monuments must be preserved for future generations.",
        diffHighlight: "You must preserve → must be preserved",
        explanation:
          "Avoid conversational pronouns like 'you' in IELTS essays by using the modal passive.",
      },
      {
        incorrect:
          "The survey data was analyze by an independent team of statisticians.",
        correct:
          "The survey data was analyzed by an independent team of statisticians.",
        diffHighlight: "was analyze → was analyzed",
        explanation:
          "Passive voice requires the past participle ending ('-ed'): 'was analyzed'.",
      },
    ],
    quickCheck: [
      {
        question:
          "Which of the following verbs CANNOT be used in the passive voice?",
        options: ["analyze", "occur", "investigate", "construct"],
        correctIndex: 1,
        explanation:
          "'Occur' is an intransitive verb. You can say 'the event occurred', but never 'the event was occurred'.",
      },
      {
        question:
          "Choose the formal passive equivalent for: 'Authorities must implement safety rules immediately.'",
        options: [
          "Safety rules must implement by authorities immediately.",
          "Safety rules must be implemented immediately.",
          "Safety rules should implementing immediately.",
          "Safety rules must been implemented immediately.",
        ],
        correctIndex: 1,
        explanation:
          "The modal passive formula is: 'must + be + past participle' ('must be implemented').",
      },
    ],
    identificationExercises: [
      {
        id: "id-voice-1",
        prompt: "Which sentence contains an ungrammatical passive construction?",
        sentences: [
          {
            text: "Detailed feedback was provided to every student following the mock exam.",
            isError: false,
            explanation:
              "'Was provided' is a standard passive form with the transitive verb 'provide'.",
          },
          {
            text: "The unexpected delay was occurred due to severe weather at the transit terminal.",
            isError: true,
            explanation:
              "'Occur' is an intransitive verb and cannot be passive. It should be: 'The unexpected delay occurred'.",
          },
          {
            text: "Strict safety measures were implemented before the construction began.",
            isError: false,
            explanation:
              "'Were implemented' is a correct passive form of the transitive verb 'implement'.",
          },
        ],
      },
      {
        id: "id-voice-2",
        prompt: "Which sentence correctly uses passive voice for an objective academic style?",
        sentences: [
          {
            text: "Renewable energy can be generated efficiently using offshore wind turbines.",
            isError: false,
            explanation:
              "'Can be generated' correctly uses the modal passive to maintain an objective tone.",
          },
          {
            text: "The ancient civilization was disappeared mysteriously over several decades.",
            isError: true,
            explanation:
              "'Disappear' cannot be made passive. It must be: 'The ancient civilization disappeared mysteriously'.",
          },
          {
            text: "Statistical models were utilized to predict consumer demand across four seasons.",
            isError: false,
            explanation:
              "'Were utilized' is a standard and correct academic passive verb phrase.",
          },
        ],
      },
    ],
  },

  {
    id: "modifiers-and-splices",
    title: "Clear Modifiers & Fixing Run-on Comma Splices",
    category: "sentence-structure",
    corePrinciple:
      "A modifier is an introductory phrase that adds extra information to a sentence. To be clear, the modifier must stand right next to the word it describes. If you leave it hanging (called a dangling modifier), it accidentally describes the wrong word. Additionally, two complete sentences can never be joined with just a comma (called a comma splice); they must be separated with a period, a semicolon, or a connecting word like 'and' or 'because'.",
    ieltsImpact:
      "Comma splices and misplaced modifiers are viewed as major sentence structure breakdowns by IELTS examiners. They interrupt the logical flow of your writing and confuse the reader, which directly damages both your Grammatical Range and Accuracy score and your Coherence and Cohesion score.",
    l1Trap:
      "In many languages, commas are used freely to string several independent thoughts together in one long sentence. In formal English, a comma alone cannot glue two complete sentences together. You must use a period, a semicolon, or a coordinating conjunction.",
    formula: `Rule 1: Fixing Dangling Modifiers
• What happens: An introductory '-ing' or '-ed' phrase must describe the subject right after the comma.
• Avoid: "Walking into the room, the lights turned on." (The lights were not walking!)
• Good: "Walking into the room, the teacher turned on the lights."

Rule 2: Fixing Comma Splices (Two complete sentences joined by only a comma)
• Avoid: "The government invested heavily in schools, literacy rates improved." (Comma Splice)
• Fix 1 (Add 'and'): "The government invested heavily in schools, and literacy rates improved."
• Fix 2 (Use Semicolon): "The government invested heavily in schools; literacy rates improved."
• Fix 3 (Use 'Because'): "Because the government invested heavily in schools, literacy rates improved."

Rule 3: Using 'However' Correctly Between Sentences
• Avoid: "The policy is popular, however it is expensive." (Comma Splice)
• Good: "The policy is popular; however, it is expensive." (Semicolon + However + Comma)`,
    keyTerms: [
      {
        term: "Dangling Modifier",
        definition:
          "A descriptive phrase that does not logically attach to the subject that follows it (e.g. 'Having finished the test, the bell rang').",
      },
      {
        term: "Comma Splice",
        definition:
          "An error where two independent, complete sentences are joined together with only a comma and no connecting word.",
      },
      {
        term: "Run-on Sentence",
        definition:
          "Two or more complete sentences joined together without appropriate punctuation or coordinating conjunctions.",
      },
      {
        term: "Independent Clause",
        definition:
          "A group of words containing a subject and a verb that expresses a complete thought and could stand alone as a sentence.",
      },
      {
        term: "Participial Phrase",
        definition:
          "An introductory phrase beginning with an '-ing' or '-ed' verb used to describe the main subject (e.g. 'Based on recent findings...').",
      },
      {
        term: "Semicolon (;)",
        definition:
          "A punctuation mark used to link two closely related independent clauses without using a coordinating conjunction.",
      },
    ],
    workedExamples: [
      {
        original:
          "Having examined data from fifty schools, the conclusion was clear.",
        issue:
          "'Having examined' is an action performed by people. The subject after the comma is 'the conclusion', but a conclusion cannot examine data. This is a dangling modifier.",
        ruleApplied:
          "Place the real actor ('the researchers') as the subject immediately following the introductory phrase.",
        corrected:
          "Having examined data from fifty schools, the researchers reached a clear conclusion.",
        explanation:
          "Now 'the researchers' logically matches the opening action 'Having examined data'.",
      },
      {
        original:
          "Electric vehicles produce zero tailpipe emissions, they are much quieter than petrol cars.",
        issue:
          "Both halves are complete sentences ('Electric vehicles produce...' and 'they are...'). Joining them with only a comma is a comma splice.",
        ruleApplied:
          "Fix a comma splice using a semicolon, a period, or a coordinating conjunction like 'and'.",
        corrected:
          "Electric vehicles produce zero tailpipe emissions; furthermore, they are much quieter than petrol cars.",
        explanation:
          "Using a semicolon and the transition word 'furthermore' correctly connects the two independent thoughts.",
      },
      {
        original:
          "Public transport investment has grown substantially, traffic congestion remains a serious problem.",
        issue:
          "Two contrasting complete sentences are joined with only a comma.",
        ruleApplied:
          "Use a subordinating conjunction like 'although' or a semicolon with 'however'.",
        corrected:
          "Although public transport investment has grown substantially, traffic congestion remains a serious problem.",
        explanation:
          "'Although' turns the first clause into a dependent clause, resolving the comma splice.",
      },
      {
        original:
          "By adopting sustainable farming methods, crop yields can increase without harming local ecosystems.",
        issue:
          "The introductory phrase 'By adopting...' describes an action. The subject after the comma is 'crop yields', but crop yields cannot adopt farming methods.",
        ruleApplied:
          "Make the human actor ('farmers') the subject of the main clause.",
        corrected:
          "By adopting sustainable farming methods, farmers can increase crop yields without harming local ecosystems.",
        explanation:
          "Now 'farmers' logically connects to the opening action 'adopting sustainable methods'.",
      },
      {
        original:
          "Many university graduates struggle to find employment, however the job market is gradually recovering.",
        issue:
          "'However' is an adverb, not a conjunction. You cannot use a simple comma before 'however' to join two complete sentences.",
        ruleApplied:
          "Use a semicolon before 'however' and a comma after it: '; however,'.",
        corrected:
          "Many university graduates struggle to find employment; however, the job market is gradually recovering.",
        explanation:
          "The semicolon properly separates the two independent clauses, and 'however' provides the transition.",
      },
    ],
    contrastivePairs: [
      {
        incorrect:
          "Renewable energy is becoming cheaper, fossil fuels remain the dominant power source.",
        correct:
          "Renewable energy is becoming cheaper; however, fossil fuels remain the dominant power source.",
        diffHighlight: "cheaper, fossil fuels → cheaper; however, fossil fuels",
        explanation:
          "Joining two complete thoughts with only a comma is a comma splice. Use a semicolon and 'however'.",
      },
      {
        incorrect:
          "Walking through the city center, the historic architecture impressed the foreign tourists.",
        correct:
          "Walking through the city center, the foreign tourists were impressed by the historic architecture.",
        diffHighlight: "architecture impressed → tourists were impressed",
        explanation:
          "The tourists were the ones walking through the center, so 'the foreign tourists' must be the subject.",
      },
      {
        incorrect:
          "Online degrees are flexible and affordable, many employers now respect them.",
        correct:
          "Online degrees are flexible and affordable, and many employers now respect them.",
        diffHighlight: "affordable, many → affordable, and many",
        explanation:
          "Add the coordinating conjunction 'and' after the comma to properly link the two independent clauses.",
      },
      {
        incorrect:
          "Based on the survey results, the policy was deemed successful by the committee.",
        correct:
          "Based on the survey results, the committee deemed the policy successful.",
        diffHighlight: "policy was deemed by committee → committee deemed policy",
        explanation:
          "Placing 'the committee' immediately after the comma creates a direct and active relationship with the modifier.",
      },
    ],
    quickCheck: [
      {
        question:
          "Identify the sentence that contains a comma splice:",
        options: [
          "Solar power is clean and renewable; moreover, installation costs are dropping.",
          "Solar power is clean and renewable, installation costs are dropping rapidly.",
          "Although solar power is clean, installation costs remain high for some households.",
          "Solar power is clean and renewable, and installation costs are dropping.",
        ],
        correctIndex: 1,
        explanation:
          "Option B joins two complete sentences with only a comma, which is an error called a comma splice.",
      },
      {
        question:
          "Which sentence correctly avoids a dangling modifier?",
        options: [
          "After reviewing the laboratory data, the hypothesis was confirmed by the scientists.",
          "After reviewing the laboratory data, the scientists confirmed their hypothesis.",
          "After reviewing the laboratory data, the experiment was considered a success.",
          "After reviewing the laboratory data, an error was detected in the calculations.",
        ],
        correctIndex: 1,
        explanation:
          "Option B is correct because the opening action ('After reviewing...') is logically performed by 'the scientists', who are the subject immediately after the comma.",
      },
    ],
    identificationExercises: [
      {
        id: "id-mod-1",
        prompt: "Which sentence contains a comma splice?",
        sentences: [
          {
            text: "Although public spending has increased, healthcare facilities in rural regions remain understaffed.",
            isError: false,
            explanation:
              "'Although' introduces a subordinate clause, so the comma is used correctly.",
          },
          {
            text: "Public transport investment has grown substantially, car ownership continues to rise in most metropolitan areas.",
            isError: true,
            explanation:
              "Two complete independent clauses are joined by only a comma without a connecting word. This is a comma splice.",
          },
          {
            text: "The proposed legislation would restrict vehicle access; critics, however, argue it disadvantages workers.",
            isError: false,
            explanation:
              "The semicolon correctly separates the two independent clauses.",
          },
        ],
      },
      {
        id: "id-mod-2",
        prompt: "Which sentence contains a dangling modifier?",
        sentences: [
          {
            text: "Having surveyed three hundred local residents, the researchers documented the social impact of the new highway.",
            isError: false,
            explanation:
              "'The researchers' is the logical subject who surveyed the residents.",
          },
          {
            text: "Faced with rising sea levels, vulnerable coastal communities have begun building sea walls.",
            isError: false,
            explanation:
              "'Coastal communities' are the entities faced with rising sea levels.",
          },
          {
            text: "Drawing on interviews with three hundred migrants, the emotional toll of displacement is clearly documented.",
            isError: true,
            explanation:
              "The introductory phrase requires a human subject (such as 'the researchers'), but the subject is 'the emotional toll', which cannot draw on interviews.",
          },
        ],
      },
    ],
  },
];

/**
 * Get lesson data for a specific topic ID
 */
export function getLessonByTopicId(topicId) {
  if (!topicId) return null;
  return GRAMMAR_LESSONS.find((l) => l.id === topicId) || null;
}

/**
 * Get all available grammar lessons
 */
export function getAllLessons() {
  return GRAMMAR_LESSONS;
}

/**
 * Deterministic "Grammar Rule of the Day"
 * Generates consistent daily content based on the calendar day of the year.
 */
export function getDailyGrammarRule() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  const lessonIndex = dayOfYear % GRAMMAR_LESSONS.length;
  const lesson = GRAMMAR_LESSONS[lessonIndex];

  return {
    dayOfYear,
    lesson,
    tip: lesson.ieltsImpact,
    formula: lesson.formula,
  };
}
