export interface WordMeaning {
  definition: string;
  example: string;
}

export interface Word {
  id: string;
  word: string;
  partOfSpeech: string;
  pronunciation: string;
  meanings: WordMeaning[];
  synonyms: string[];
  antonyms: string[];
  typesOfUse: string[];
}

export const WORD_BANK: Word[] = [
  {
    id: "w001",
    word: "ambiguous",
    partOfSpeech: "adjective",
    pronunciation: "am-BIG-yoo-us",
    meanings: [
      {
        definition: "Open to more than one interpretation; unclear",
        example: "The ambiguous instructions confused the entire class.",
      },
      {
        definition: "Doubtful or uncertain",
        example: "His ambiguous answer left everyone puzzled.",
      },
    ],
    synonyms: ["vague", "unclear", "uncertain", "obscure"],
    antonyms: ["clear", "definite", "explicit"],
    typesOfUse: ["formal writing", "essay", "debate"],
  },
  {
    id: "w002",
    word: "eloquent",
    partOfSpeech: "adjective",
    pronunciation: "EL-oh-kwent",
    meanings: [
      {
        definition: "Fluent and persuasive in speaking or writing",
        example: "She delivered an eloquent speech at the ceremony.",
      },
      {
        definition: "Clearly expressive",
        example: "His eloquent letter moved everyone to tears.",
      },
    ],
    synonyms: ["articulate", "fluent", "expressive", "persuasive"],
    antonyms: ["inarticulate", "stumbling", "hesitant"],
    typesOfUse: ["speech", "essay", "formal writing"],
  },
  {
    id: "w003",
    word: "perseverance",
    partOfSpeech: "noun",
    pronunciation: "per-suh-VEER-ance",
    meanings: [
      {
        definition: "Continued effort despite difficulty",
        example: "Her perseverance helped her pass the board exams.",
      },
      {
        definition: "Steadfastness despite obstacles",
        example: "Perseverance is the key to achieving long-term goals.",
      },
    ],
    synonyms: ["persistence", "determination", "tenacity", "endurance"],
    antonyms: ["laziness", "surrender", "quitting"],
    typesOfUse: ["motivational essay", "character description", "speech"],
  },
  {
    id: "w004",
    word: "meticulous",
    partOfSpeech: "adjective",
    pronunciation: "meh-TIK-yoo-lus",
    meanings: [
      {
        definition: "Showing great attention to detail",
        example: "The meticulous student checked every answer twice.",
      },
      {
        definition: "Very careful and precise",
        example: "She was meticulous in her exam preparation.",
      },
    ],
    synonyms: ["thorough", "careful", "precise", "painstaking"],
    antonyms: ["careless", "sloppy", "negligent"],
    typesOfUse: ["formal writing", "descriptive essay", "reports"],
  },
  {
    id: "w005",
    word: "diligent",
    partOfSpeech: "adjective",
    pronunciation: "DIL-ih-jent",
    meanings: [
      {
        definition: "Having or showing care and effort in work",
        example: "A diligent student always completes homework on time.",
      },
      {
        definition: "Steadily industrious",
        example: "His diligent revision paid off during the exams.",
      },
    ],
    synonyms: ["hardworking", "industrious", "assiduous", "careful"],
    antonyms: ["lazy", "idle", "negligent"],
    typesOfUse: ["character description", "essay", "recommendation letter"],
  },
  {
    id: "w006",
    word: "profound",
    partOfSpeech: "adjective",
    pronunciation: "pruh-FOUND",
    meanings: [
      {
        definition: "Very great or intense; having deep insight",
        example: "The book had a profound effect on her thinking.",
      },
      {
        definition: "Deep in meaning or thought",
        example: "He made a profound observation about society.",
      },
    ],
    synonyms: ["deep", "intense", "significant", "meaningful"],
    antonyms: ["shallow", "superficial", "trivial"],
    typesOfUse: ["literary analysis", "essay", "formal writing"],
  },
  {
    id: "w007",
    word: "concise",
    partOfSpeech: "adjective",
    pronunciation: "kun-SYSE",
    meanings: [
      {
        definition: "Giving much information clearly in few words",
        example: "Write a concise summary of the chapter.",
      },
      {
        definition: "Brief but comprehensive",
        example: "Her concise explanation helped everyone understand quickly.",
      },
    ],
    synonyms: ["brief", "succinct", "terse", "compact"],
    antonyms: ["verbose", "wordy", "lengthy"],
    typesOfUse: ["exam writing", "essay", "report"],
  },
  {
    id: "w008",
    word: "vivid",
    partOfSpeech: "adjective",
    pronunciation: "VIV-id",
    meanings: [
      {
        definition: "Producing powerful feelings or strong clear images",
        example: "She gave a vivid description of the scene.",
      },
      {
        definition: "Very bright in color",
        example: "The painting used vivid colors to express emotion.",
      },
    ],
    synonyms: ["bright", "striking", "colorful", "graphic"],
    antonyms: ["dull", "faint", "dim", "vague"],
    typesOfUse: ["descriptive writing", "story", "creative essay"],
  },
  {
    id: "w009",
    word: "emphasize",
    partOfSpeech: "verb",
    pronunciation: "EM-fuh-size",
    meanings: [
      {
        definition: "Give special importance to something",
        example: "The teacher emphasized the importance of revision.",
      },
      {
        definition: "Make something more distinct or prominent",
        example: "He emphasized his point by repeating it.",
      },
    ],
    synonyms: ["stress", "highlight", "underline", "accentuate"],
    antonyms: ["minimize", "downplay", "understate"],
    typesOfUse: ["formal writing", "speech", "essay"],
  },
  {
    id: "w010",
    word: "phenomenon",
    partOfSpeech: "noun",
    pronunciation: "fuh-NOM-ih-nun",
    meanings: [
      {
        definition: "A fact or situation that is observed to exist",
        example: "Acid rain is a natural phenomenon caused by pollution.",
      },
      {
        definition: "A remarkable person or thing",
        example: "He was a phenomenon in the field of mathematics.",
      },
    ],
    synonyms: ["occurrence", "event", "happening", "spectacle"],
    antonyms: ["normality", "commonplace", "routine"],
    typesOfUse: ["science essay", "formal writing", "analysis"],
  },
  {
    id: "w011",
    word: "elaborate",
    partOfSpeech: "verb",
    pronunciation: "ih-LAB-uh-rate",
    meanings: [
      {
        definition: "Develop or present in further detail",
        example: "Could you elaborate on your point about climate change?",
      },
      {
        definition: "Work out carefully in detail",
        example: "She elaborated her plan before presenting it.",
      },
    ],
    synonyms: ["expand", "explain", "detail", "develop"],
    antonyms: ["simplify", "condense", "abridge"],
    typesOfUse: ["exam answer", "essay", "formal writing"],
  },
  {
    id: "w012",
    word: "significant",
    partOfSpeech: "adjective",
    pronunciation: "sig-NIF-ih-kunt",
    meanings: [
      {
        definition: "Important; of consequence",
        example: "The discovery had significant implications for science.",
      },
      {
        definition: "Large enough to be noticed",
        example: "There was a significant improvement in her grades.",
      },
    ],
    synonyms: ["important", "notable", "considerable", "meaningful"],
    antonyms: ["insignificant", "trivial", "minor"],
    typesOfUse: ["formal writing", "essay", "report"],
  },
  {
    id: "w013",
    word: "substantial",
    partOfSpeech: "adjective",
    pronunciation: "sub-STAN-shul",
    meanings: [
      {
        definition: "Of considerable importance or size",
        example: "She made a substantial improvement in mathematics.",
      },
      {
        definition: "Real and tangible",
        example: "He provided substantial evidence for his argument.",
      },
    ],
    synonyms: ["considerable", "significant", "large", "ample"],
    antonyms: ["small", "minor", "negligible"],
    typesOfUse: ["formal writing", "essay", "report"],
  },
  {
    id: "w014",
    word: "inevitable",
    partOfSpeech: "adjective",
    pronunciation: "in-EV-ih-tuh-bul",
    meanings: [
      {
        definition: "Certain to happen; unavoidable",
        example: "Change is inevitable in every society.",
      },
      {
        definition: "So frequently seen as to be expected",
        example: "His success was inevitable given his hard work.",
      },
    ],
    synonyms: ["unavoidable", "certain", "inescapable", "sure"],
    antonyms: ["avoidable", "preventable", "unlikely"],
    typesOfUse: ["formal essay", "speech", "argument"],
  },
  {
    id: "w015",
    word: "consequence",
    partOfSpeech: "noun",
    pronunciation: "KON-sih-kwence",
    meanings: [
      {
        definition: "A result or effect of an action",
        example: "One consequence of deforestation is soil erosion.",
      },
      {
        definition: "Importance or relevance",
        example: "The matter is of great consequence to our future.",
      },
    ],
    synonyms: ["result", "outcome", "effect", "repercussion"],
    antonyms: ["cause", "origin", "source"],
    typesOfUse: ["science essay", "formal writing", "argument"],
  },
  {
    id: "w016",
    word: "analyze",
    partOfSpeech: "verb",
    pronunciation: "AN-uh-lyze",
    meanings: [
      {
        definition: "Examine in detail to understand or explain",
        example: "Analyze the poem for its use of imagery.",
      },
      {
        definition: "Identify the elements of something",
        example: "We need to analyze the data carefully.",
      },
    ],
    synonyms: ["examine", "study", "investigate", "evaluate"],
    antonyms: ["overlook", "ignore", "neglect"],
    typesOfUse: ["exam instruction", "essay", "research"],
  },
  {
    id: "w017",
    word: "interpret",
    partOfSpeech: "verb",
    pronunciation: "in-TER-prit",
    meanings: [
      {
        definition: "Explain the meaning of something",
        example: "Interpret the author's use of symbolism in the story.",
      },
      {
        definition: "Understand in a particular way",
        example: "Students may interpret the poem differently.",
      },
    ],
    synonyms: ["explain", "clarify", "decode", "translate"],
    antonyms: ["misinterpret", "confuse", "misunderstand"],
    typesOfUse: ["literary analysis", "exam answer", "essay"],
  },
  {
    id: "w018",
    word: "evaluate",
    partOfSpeech: "verb",
    pronunciation: "ih-VAL-yoo-ate",
    meanings: [
      {
        definition: "Make a judgement about the value of something",
        example: "Evaluate the effectiveness of the government's policy.",
      },
      {
        definition: "Assess based on evidence",
        example: "Students are asked to evaluate both sides of the argument.",
      },
    ],
    synonyms: ["assess", "judge", "appraise", "rate"],
    antonyms: ["ignore", "disregard", "overlook"],
    typesOfUse: ["exam instruction", "essay", "critical writing"],
  },
  {
    id: "w019",
    word: "comprehend",
    partOfSpeech: "verb",
    pronunciation: "kom-prih-HEND",
    meanings: [
      {
        definition: "Understand fully",
        example: "It is difficult to comprehend the scale of the universe.",
      },
      {
        definition: "Grasp the meaning of",
        example: "She could not comprehend why he had left.",
      },
    ],
    synonyms: ["understand", "grasp", "fathom", "perceive"],
    antonyms: ["misunderstand", "confuse", "miss"],
    typesOfUse: ["formal writing", "exam answer", "essay"],
  },
  {
    id: "w020",
    word: "illustrate",
    partOfSpeech: "verb",
    pronunciation: "IL-uh-strate",
    meanings: [
      {
        definition: "Explain or make clear by examples",
        example: "Illustrate your answer with relevant examples.",
      },
      {
        definition: "Provide visual examples",
        example: "Use a diagram to illustrate the water cycle.",
      },
    ],
    synonyms: ["demonstrate", "show", "exemplify", "explain"],
    antonyms: ["obscure", "confuse", "hide"],
    typesOfUse: ["exam instruction", "essay", "formal writing"],
  },
  {
    id: "w021",
    word: "relevant",
    partOfSpeech: "adjective",
    pronunciation: "REL-uh-vunt",
    meanings: [
      {
        definition: "Closely connected to the subject at hand",
        example: "Include only relevant information in your answer.",
      },
      {
        definition: "Appropriate to current conditions",
        example: "His skills are still relevant in today's world.",
      },
    ],
    synonyms: ["pertinent", "applicable", "related", "fitting"],
    antonyms: ["irrelevant", "unrelated", "inappropriate"],
    typesOfUse: ["exam answer", "essay", "formal writing"],
  },
  {
    id: "w022",
    word: "justify",
    partOfSpeech: "verb",
    pronunciation: "JUS-tih-fy",
    meanings: [
      {
        definition: "Show or prove to be right",
        example: "Justify your answer with evidence from the text.",
      },
      {
        definition: "Give good reason for an action",
        example: "He tried to justify his absence with a doctor's note.",
      },
    ],
    synonyms: ["support", "defend", "explain", "validate"],
    antonyms: ["contradict", "oppose", "undermine"],
    typesOfUse: ["exam instruction", "argument essay", "formal writing"],
  },
  {
    id: "w023",
    word: "appropriate",
    partOfSpeech: "adjective",
    pronunciation: "uh-PROH-pree-ut",
    meanings: [
      {
        definition: "Suitable or proper in the circumstances",
        example: "Use appropriate language in your formal letter.",
      },
      {
        definition: "Fitting for a particular purpose",
        example: "Choose the most appropriate word for the blank.",
      },
    ],
    synonyms: ["suitable", "proper", "fitting", "correct"],
    antonyms: ["inappropriate", "unsuitable", "improper"],
    typesOfUse: ["formal writing", "exam answer", "letter writing"],
  },
  {
    id: "w024",
    word: "accurate",
    partOfSpeech: "adjective",
    pronunciation: "AK-yur-it",
    meanings: [
      {
        definition: "Correct in all details; exact",
        example: "Provide an accurate account of the events.",
      },
      {
        definition: "Capable of providing correct information",
        example: "Her calculations were accurate to two decimal places.",
      },
    ],
    synonyms: ["correct", "precise", "exact", "truthful"],
    antonyms: ["inaccurate", "wrong", "imprecise"],
    typesOfUse: ["formal writing", "science report", "essay"],
  },
  {
    id: "w025",
    word: "effective",
    partOfSpeech: "adjective",
    pronunciation: "ih-FEK-tiv",
    meanings: [
      {
        definition: "Successful in producing a desired result",
        example: "An effective study plan includes regular revision.",
      },
      {
        definition: "Having a striking effect",
        example: "Her speech was effective in persuading the audience.",
      },
    ],
    synonyms: ["successful", "efficient", "productive", "powerful"],
    antonyms: ["ineffective", "useless", "weak"],
    typesOfUse: ["formal writing", "essay", "report"],
  },
  {
    id: "w026",
    word: "efficient",
    partOfSpeech: "adjective",
    pronunciation: "ih-FISH-ent",
    meanings: [
      {
        definition: "Achieving maximum productivity with minimum effort",
        example: "An efficient student manages time wisely.",
      },
      {
        definition: "Working in a well-organized way",
        example: "The new system was more efficient than the old one.",
      },
    ],
    synonyms: ["productive", "effective", "capable", "organized"],
    antonyms: ["inefficient", "wasteful", "slow"],
    typesOfUse: ["formal writing", "report", "essay"],
  },
  {
    id: "w027",
    word: "hypothesis",
    partOfSpeech: "noun",
    pronunciation: "hy-POTH-uh-sis",
    meanings: [
      {
        definition: "A proposed explanation for a phenomenon",
        example:
          "The scientist formed a hypothesis before conducting the experiment.",
      },
      {
        definition: "An assumption made for investigation",
        example: "Her hypothesis was proven correct by the results.",
      },
    ],
    synonyms: ["theory", "assumption", "supposition", "proposition"],
    antonyms: ["fact", "certainty", "proof"],
    typesOfUse: ["science essay", "formal writing", "research"],
  },
  {
    id: "w028",
    word: "inference",
    partOfSpeech: "noun",
    pronunciation: "IN-fer-ence",
    meanings: [
      {
        definition: "A conclusion reached from evidence and reasoning",
        example: "Draw an inference from the data provided.",
      },
      {
        definition: "The process of reaching a conclusion",
        example: "His inference was based on careful observation.",
      },
    ],
    synonyms: ["conclusion", "deduction", "reasoning", "interpretation"],
    antonyms: ["assumption", "guess", "speculation"],
    typesOfUse: ["exam answer", "science writing", "essay"],
  },
  {
    id: "w029",
    word: "perspective",
    partOfSpeech: "noun",
    pronunciation: "per-SPEK-tiv",
    meanings: [
      {
        definition: "A particular way of thinking about something",
        example: "Consider the issue from a student's perspective.",
      },
      {
        definition: "The art of drawing to create depth",
        example: "The painting used perspective to show distance.",
      },
    ],
    synonyms: ["viewpoint", "standpoint", "outlook", "approach"],
    antonyms: ["shortsightedness", "narrow-mindedness"],
    typesOfUse: ["essay", "formal writing", "debate"],
  },
  {
    id: "w030",
    word: "critique",
    partOfSpeech: "noun",
    pronunciation: "krih-TEEK",
    meanings: [
      {
        definition: "A detailed analysis and assessment",
        example: "Write a critique of the poem you have studied.",
      },
      {
        definition: "A critical review or commentary",
        example: "Her critique of the film was well-researched.",
      },
    ],
    synonyms: ["analysis", "review", "evaluation", "commentary"],
    antonyms: ["praise", "approval", "endorsement"],
    typesOfUse: ["literary analysis", "essay", "formal writing"],
  },
  {
    id: "w031",
    word: "advocate",
    partOfSpeech: "verb",
    pronunciation: "AD-vuh-kate",
    meanings: [
      {
        definition: "Publicly recommend or support",
        example: "She advocates for better environmental policies.",
      },
      {
        definition: "Plead in favor of",
        example: "He advocates giving equal opportunities to all students.",
      },
    ],
    synonyms: ["support", "promote", "champion", "endorse"],
    antonyms: ["oppose", "discourage", "reject"],
    typesOfUse: ["speech", "essay", "persuasive writing"],
  },
  {
    id: "w032",
    word: "benevolent",
    partOfSpeech: "adjective",
    pronunciation: "buh-NEV-uh-lent",
    meanings: [
      {
        definition: "Well-meaning and kindly",
        example: "The benevolent teacher helped all struggling students.",
      },
      {
        definition: "Organized to do charitable work",
        example: "The organization had a benevolent purpose.",
      },
    ],
    synonyms: ["kind", "generous", "charitable", "compassionate"],
    antonyms: ["malevolent", "cruel", "unkind"],
    typesOfUse: ["character description", "essay", "formal writing"],
  },
  {
    id: "w033",
    word: "contemplate",
    partOfSpeech: "verb",
    pronunciation: "KON-tem-plate",
    meanings: [
      {
        definition: "Think about deeply",
        example: "She contemplated the meaning of the poem.",
      },
      {
        definition: "Consider as a possible action",
        example: "He contemplated taking a year off after board exams.",
      },
    ],
    synonyms: ["ponder", "consider", "reflect", "muse"],
    antonyms: ["ignore", "dismiss", "disregard"],
    typesOfUse: ["formal writing", "essay", "reflective writing"],
  },
  {
    id: "w034",
    word: "deteriorate",
    partOfSpeech: "verb",
    pronunciation: "dih-TEER-ee-uh-rate",
    meanings: [
      {
        definition: "Become progressively worse",
        example: "Air quality continues to deteriorate in urban areas.",
      },
      {
        definition: "Decline in quality or condition",
        example: "His health began to deteriorate during the exam season.",
      },
    ],
    synonyms: ["worsen", "decline", "degrade", "weaken"],
    antonyms: ["improve", "advance", "recover"],
    typesOfUse: ["science essay", "formal writing", "report"],
  },
  {
    id: "w035",
    word: "eradicate",
    partOfSpeech: "verb",
    pronunciation: "ih-RAD-ih-kate",
    meanings: [
      {
        definition: "Destroy completely",
        example: "The government aims to eradicate poverty by 2030.",
      },
      {
        definition: "Remove completely",
        example: "Steps were taken to eradicate the disease.",
      },
    ],
    synonyms: ["eliminate", "abolish", "destroy", "remove"],
    antonyms: ["create", "introduce", "foster"],
    typesOfUse: ["formal essay", "speech", "report"],
  },
  {
    id: "w036",
    word: "facilitate",
    partOfSpeech: "verb",
    pronunciation: "fuh-SIL-ih-tate",
    meanings: [
      {
        definition: "Make an action easier",
        example: "Technology facilitates learning in modern classrooms.",
      },
      {
        definition: "Help bring about a result",
        example: "The teacher facilitated the group discussion effectively.",
      },
    ],
    synonyms: ["aid", "help", "assist", "enable"],
    antonyms: ["hinder", "obstruct", "impede"],
    typesOfUse: ["formal essay", "report", "speech"],
  },
  {
    id: "w037",
    word: "fundamental",
    partOfSpeech: "adjective",
    pronunciation: "fun-duh-MEN-tul",
    meanings: [
      {
        definition: "Forming a necessary base",
        example: "Hard work is a fundamental requirement for success.",
      },
      {
        definition: "Of central importance",
        example: "Clean water is a fundamental human right.",
      },
    ],
    synonyms: ["basic", "essential", "core", "primary"],
    antonyms: ["secondary", "unimportant", "trivial"],
    typesOfUse: ["formal writing", "essay", "argument"],
  },
  {
    id: "w038",
    word: "generate",
    partOfSpeech: "verb",
    pronunciation: "JEN-uh-rate",
    meanings: [
      {
        definition: "Produce or create",
        example: "Solar panels generate electricity from sunlight.",
      },
      {
        definition: "Cause a situation to arise",
        example: "The debate generated a lot of interest among students.",
      },
    ],
    synonyms: ["produce", "create", "yield", "bring about"],
    antonyms: ["destroy", "eliminate", "consume"],
    typesOfUse: ["science essay", "formal writing", "report"],
  },
  {
    id: "w039",
    word: "hierarchy",
    partOfSpeech: "noun",
    pronunciation: "HY-uh-rar-kee",
    meanings: [
      {
        definition: "A system ranking things above or below each other",
        example: "There is a hierarchy of needs described by Maslow.",
      },
      {
        definition: "Arrangement according to importance",
        example: "The school has a clear hierarchy of authority.",
      },
    ],
    synonyms: ["ranking", "order", "structure", "grading"],
    antonyms: ["equality", "disorder", "chaos"],
    typesOfUse: ["formal writing", "essay", "sociology"],
  },
  {
    id: "w040",
    word: "impartial",
    partOfSpeech: "adjective",
    pronunciation: "im-PAR-shul",
    meanings: [
      {
        definition: "Treating all rivals equally; fair",
        example: "A judge must remain impartial during a trial.",
      },
      {
        definition: "Not favoring one side over another",
        example: "Write an impartial account of the historical event.",
      },
    ],
    synonyms: ["unbiased", "fair", "neutral", "objective"],
    antonyms: ["biased", "partial", "prejudiced"],
    typesOfUse: ["formal essay", "report", "debate"],
  },
  {
    id: "w041",
    word: "juxtapose",
    partOfSpeech: "verb",
    pronunciation: "JUK-stuh-pose",
    meanings: [
      {
        definition: "Place side by side for contrasting effect",
        example: "The author juxtaposes wealth and poverty in the novel.",
      },
      {
        definition: "Place in comparison",
        example: "Juxtapose the two characters to highlight differences.",
      },
    ],
    synonyms: ["contrast", "compare", "place alongside"],
    antonyms: ["separate", "isolate"],
    typesOfUse: ["literary analysis", "essay", "comparative writing"],
  },
  {
    id: "w042",
    word: "leverage",
    partOfSpeech: "verb",
    pronunciation: "LEV-er-ij",
    meanings: [
      {
        definition: "Use to maximum advantage",
        example: "Students can leverage technology to enhance learning.",
      },
      {
        definition: "Use a skill as a means to achieve a goal",
        example: "She leveraged her strengths to succeed in the exam.",
      },
    ],
    synonyms: ["use", "exploit", "utilize", "harness"],
    antonyms: ["waste", "squander", "ignore"],
    typesOfUse: ["formal writing", "speech", "essay"],
  },
  {
    id: "w043",
    word: "mitigate",
    partOfSpeech: "verb",
    pronunciation: "MIT-ih-gate",
    meanings: [
      {
        definition: "Make less severe or serious",
        example: "Planting trees helps mitigate the effects of pollution.",
      },
      {
        definition: "Lessen the impact of a negative event",
        example: "She tried to mitigate the misunderstanding with an apology.",
      },
    ],
    synonyms: ["reduce", "lessen", "minimize", "alleviate"],
    antonyms: ["worsen", "aggravate", "intensify"],
    typesOfUse: ["formal essay", "environment writing", "report"],
  },
  {
    id: "w044",
    word: "narrative",
    partOfSpeech: "noun",
    pronunciation: "NAR-uh-tiv",
    meanings: [
      {
        definition: "A spoken or written account of events",
        example: "The narrative of the novel spans fifty years.",
      },
      {
        definition: "A particular interpretation of events",
        example: "The news channel presented a biased narrative.",
      },
    ],
    synonyms: ["story", "account", "tale", "description"],
    antonyms: ["argument", "analysis", "critique"],
    typesOfUse: ["literary analysis", "essay", "story writing"],
  },
  {
    id: "w045",
    word: "objective",
    partOfSpeech: "adjective",
    pronunciation: "ob-JEK-tiv",
    meanings: [
      {
        definition: "Not influenced by personal feelings; neutral",
        example: "Try to be objective when evaluating your own work.",
      },
      {
        definition: "Based on facts rather than opinions",
        example: "Her objective analysis of the data impressed the examiner.",
      },
    ],
    synonyms: ["impartial", "unbiased", "neutral", "factual"],
    antonyms: ["subjective", "biased", "partial"],
    typesOfUse: ["formal writing", "report", "essay"],
  },
  {
    id: "w046",
    word: "paradigm",
    partOfSpeech: "noun",
    pronunciation: "PAIR-uh-dyme",
    meanings: [
      {
        definition: "A typical example or pattern of something",
        example: "This experiment became a paradigm for future research.",
      },
      {
        definition: "A world view underlying the theories of a field",
        example: "The scientific paradigm shifted with Darwin's discoveries.",
      },
    ],
    synonyms: ["model", "pattern", "example", "standard"],
    antonyms: ["deviation", "abnormality", "exception"],
    typesOfUse: ["science essay", "formal writing", "research"],
  },
  {
    id: "w047",
    word: "quantify",
    partOfSpeech: "verb",
    pronunciation: "KWON-tih-fy",
    meanings: [
      {
        definition: "Express or measure the quantity of",
        example: "It is difficult to quantify the impact of education.",
      },
      {
        definition: "Give a numerical value to",
        example: "The researchers quantified the results using statistics.",
      },
    ],
    synonyms: ["measure", "calculate", "count", "assess"],
    antonyms: ["estimate", "guess", "approximate"],
    typesOfUse: ["science writing", "formal essay", "research"],
  },
  {
    id: "w048",
    word: "resilient",
    partOfSpeech: "adjective",
    pronunciation: "rih-ZIL-yent",
    meanings: [
      {
        definition: "Able to recover quickly from difficulties",
        example: "A resilient student does not give up after failure.",
      },
      {
        definition: "Tending to spring back after being compressed",
        example: "The resilient material returned to its original shape.",
      },
    ],
    synonyms: ["tough", "adaptable", "strong", "robust"],
    antonyms: ["fragile", "weak", "vulnerable"],
    typesOfUse: ["motivational essay", "character writing", "speech"],
  },
  {
    id: "w049",
    word: "scrutinize",
    partOfSpeech: "verb",
    pronunciation: "SKROO-tuh-nize",
    meanings: [
      {
        definition: "Examine or inspect closely",
        example: "The examiner scrutinized every answer carefully.",
      },
      {
        definition: "Look at carefully for problems",
        example: "He scrutinized the data before drawing conclusions.",
      },
    ],
    synonyms: ["examine", "inspect", "analyze", "study"],
    antonyms: ["overlook", "ignore", "neglect"],
    typesOfUse: ["formal writing", "essay", "report"],
  },
  {
    id: "w050",
    word: "transparency",
    partOfSpeech: "noun",
    pronunciation: "trans-PAIR-en-see",
    meanings: [
      {
        definition: "The quality of being open and honest",
        example: "Transparency in government builds public trust.",
      },
      {
        definition: "The condition of allowing light to pass through",
        example: "The transparency of glass makes it useful for windows.",
      },
    ],
    synonyms: ["openness", "clarity", "honesty", "candor"],
    antonyms: ["secrecy", "opacity", "deception"],
    typesOfUse: ["formal essay", "civics", "speech"],
  },
  {
    id: "w051",
    word: "unanimous",
    partOfSpeech: "adjective",
    pronunciation: "yoo-NAN-ih-mus",
    meanings: [
      {
        definition: "All agreeing; without opposition",
        example: "The committee reached a unanimous decision.",
      },
      {
        definition: "Sharing the same opinion",
        example:
          "The class was unanimous in choosing the class representative.",
      },
    ],
    synonyms: ["agreed", "united", "collective", "concurrent"],
    antonyms: ["divided", "split", "disagreeing"],
    typesOfUse: ["formal writing", "civics", "essay"],
  },
  {
    id: "w052",
    word: "validate",
    partOfSpeech: "verb",
    pronunciation: "VAL-ih-date",
    meanings: [
      {
        definition: "Demonstrate the validity of something",
        example: "The experiment was used to validate the theory.",
      },
      {
        definition: "Confirm officially that something is correct",
        example: "The teacher validated his interpretation of the poem.",
      },
    ],
    synonyms: ["confirm", "verify", "support", "prove"],
    antonyms: ["invalidate", "refute", "disprove"],
    typesOfUse: ["science essay", "formal writing", "argument"],
  },
  {
    id: "w053",
    word: "versatile",
    partOfSpeech: "adjective",
    pronunciation: "VER-suh-tile",
    meanings: [
      {
        definition: "Able to adapt to many different uses",
        example: "A versatile student performs well in all subjects.",
      },
      {
        definition: "Having many uses or applications",
        example: "The internet is a versatile tool for learning.",
      },
    ],
    synonyms: ["adaptable", "flexible", "multipurpose", "all-round"],
    antonyms: ["limited", "inflexible", "specialized"],
    typesOfUse: ["formal writing", "character description", "essay"],
  },
  {
    id: "w054",
    word: "ambivalent",
    partOfSpeech: "adjective",
    pronunciation: "am-BIV-uh-lent",
    meanings: [
      {
        definition: "Having mixed feelings about someone or something",
        example: "She was ambivalent about the new school policy.",
      },
      {
        definition: "Uncertain about what to think or do",
        example: "He felt ambivalent about leaving his hometown for college.",
      },
    ],
    synonyms: ["uncertain", "undecided", "conflicted", "hesitant"],
    antonyms: ["certain", "decisive", "sure"],
    typesOfUse: ["formal writing", "essay", "reflective writing"],
  },
  {
    id: "w055",
    word: "coerce",
    partOfSpeech: "verb",
    pronunciation: "koh-ERS",
    meanings: [
      {
        definition: "Force to act in a required way using threats",
        example: "No student should be coerced into answering questions.",
      },
      {
        definition: "Persuade using force",
        example: "He was coerced into signing the document.",
      },
    ],
    synonyms: ["force", "compel", "pressure", "intimidate"],
    antonyms: ["persuade", "encourage", "guide"],
    typesOfUse: ["formal essay", "civics", "debate"],
  },
  {
    id: "w056",
    word: "comprehensive",
    partOfSpeech: "adjective",
    pronunciation: "kom-prih-HEN-siv",
    meanings: [
      {
        definition: "Including all or nearly all elements",
        example: "Write a comprehensive account of the French Revolution.",
      },
      {
        definition: "Complete and thorough",
        example: "She gave a comprehensive reply to every question.",
      },
    ],
    synonyms: ["complete", "thorough", "exhaustive", "inclusive"],
    antonyms: ["incomplete", "partial", "limited"],
    typesOfUse: ["formal writing", "exam answer", "essay"],
  },
  {
    id: "w057",
    word: "contradict",
    partOfSpeech: "verb",
    pronunciation: "kon-truh-DIKT",
    meanings: [
      {
        definition: "Deny the truth of a statement",
        example: "His actions contradict his words.",
      },
      {
        definition: "Be in conflict with",
        example: "The new evidence contradicts the earlier findings.",
      },
    ],
    synonyms: ["deny", "oppose", "conflict with", "challenge"],
    antonyms: ["confirm", "support", "agree"],
    typesOfUse: ["argument essay", "debate", "formal writing"],
  },
  {
    id: "w058",
    word: "deduce",
    partOfSpeech: "verb",
    pronunciation: "dih-DYOOS",
    meanings: [
      {
        definition: "Arrive at a fact by reasoning",
        example: "From the clues, we can deduce the meaning of the passage.",
      },
      {
        definition: "Draw a logical conclusion",
        example: "She deduced the correct answer from the given information.",
      },
    ],
    synonyms: ["conclude", "infer", "reason", "derive"],
    antonyms: ["guess", "assume", "speculate"],
    typesOfUse: ["formal writing", "science essay", "exam answer"],
  },
  {
    id: "w059",
    word: "empirical",
    partOfSpeech: "adjective",
    pronunciation: "em-PEER-ih-kul",
    meanings: [
      {
        definition: "Based on observation or experiment",
        example: "The empirical evidence supported their theory.",
      },
      {
        definition: "Verifiable through observation",
        example: "Science relies on empirical data.",
      },
    ],
    synonyms: ["experimental", "observed", "practical", "factual"],
    antonyms: ["theoretical", "speculative", "hypothetical"],
    typesOfUse: ["science essay", "research writing", "formal essay"],
  },
  {
    id: "w060",
    word: "exemplify",
    partOfSpeech: "verb",
    pronunciation: "ig-ZEM-plih-fy",
    meanings: [
      {
        definition: "Be a typical example of",
        example: "Her hard work exemplifies dedication and discipline.",
      },
      {
        definition: "Give an example of",
        example: "Use the graph to exemplify your point.",
      },
    ],
    synonyms: ["demonstrate", "illustrate", "represent", "typify"],
    antonyms: ["contradict", "counter", "undermine"],
    typesOfUse: ["essay", "formal writing", "exam answer"],
  },
  {
    id: "w061",
    word: "fluctuate",
    partOfSpeech: "verb",
    pronunciation: "FLUK-choo-ate",
    meanings: [
      {
        definition: "Rise and fall irregularly in number or amount",
        example: "Temperature fluctuates a lot in desert regions.",
      },
      {
        definition: "Change frequently",
        example: "His mood seemed to fluctuate during exam season.",
      },
    ],
    synonyms: ["vary", "change", "oscillate", "shift"],
    antonyms: ["stabilize", "remain constant", "settle"],
    typesOfUse: ["science essay", "economics", "formal writing"],
  },
  {
    id: "w062",
    word: "gregarious",
    partOfSpeech: "adjective",
    pronunciation: "grih-GAIR-ee-us",
    meanings: [
      {
        definition: "Fond of company; sociable",
        example: "Her gregarious nature made her popular in class.",
      },
      {
        definition: "Living in groups",
        example: "Wolves are gregarious animals that live in packs.",
      },
    ],
    synonyms: ["sociable", "outgoing", "friendly", "extrovert"],
    antonyms: ["shy", "solitary", "introverted"],
    typesOfUse: ["character writing", "essay", "formal writing"],
  },
  {
    id: "w063",
    word: "hinder",
    partOfSpeech: "verb",
    pronunciation: "HIN-der",
    meanings: [
      {
        definition: "Create difficulties for",
        example: "Lack of sleep can hinder academic performance.",
      },
      {
        definition: "Be an obstacle to",
        example: "Poor planning may hinder your progress.",
      },
    ],
    synonyms: ["obstruct", "impede", "block", "prevent"],
    antonyms: ["help", "aid", "facilitate"],
    typesOfUse: ["formal writing", "essay", "report"],
  },
  {
    id: "w064",
    word: "innovative",
    partOfSpeech: "adjective",
    pronunciation: "IN-uh-vay-tiv",
    meanings: [
      {
        definition: "Introducing new ideas",
        example: "The teacher used innovative methods to explain the concept.",
      },
      {
        definition: "Using original and creative thinking",
        example: "India needs innovative solutions to environmental problems.",
      },
    ],
    synonyms: ["creative", "original", "inventive", "novel"],
    antonyms: ["conventional", "traditional", "unoriginal"],
    typesOfUse: ["formal essay", "speech", "technology writing"],
  },
  {
    id: "w065",
    word: "jeopardize",
    partOfSpeech: "verb",
    pronunciation: "JEP-er-dize",
    meanings: [
      {
        definition: "Put into a situation of risk",
        example: "Skipping revision can jeopardize your board exam results.",
      },
      {
        definition: "Threaten to harm or damage",
        example: "Poor health can jeopardize academic success.",
      },
    ],
    synonyms: ["risk", "endanger", "threaten", "compromise"],
    antonyms: ["protect", "safeguard", "secure"],
    typesOfUse: ["formal writing", "essay", "persuasive writing"],
  },
  {
    id: "w066",
    word: "keen",
    partOfSpeech: "adjective",
    pronunciation: "KEEN",
    meanings: [
      {
        definition: "Having a sharp edge or point; intense",
        example: "She has a keen interest in science and mathematics.",
      },
      {
        definition: "Eager and enthusiastic",
        example: "He was keen to learn new vocabulary every day.",
      },
    ],
    synonyms: ["eager", "enthusiastic", "sharp", "intense"],
    antonyms: ["indifferent", "apathetic", "uninterested"],
    typesOfUse: ["formal writing", "character description", "essay"],
  },
  {
    id: "w067",
    word: "liberate",
    partOfSpeech: "verb",
    pronunciation: "LIB-uh-rate",
    meanings: [
      {
        definition: "Set free from a situation",
        example: "Education can liberate people from the cycle of poverty.",
      },
      {
        definition: "Release from confinement",
        example: "The freedom movement sought to liberate the nation.",
      },
    ],
    synonyms: ["free", "release", "empower", "unshackle"],
    antonyms: ["confine", "restrict", "oppress"],
    typesOfUse: ["history essay", "formal writing", "speech"],
  },
  {
    id: "w068",
    word: "mandatory",
    partOfSpeech: "adjective",
    pronunciation: "MAN-duh-tor-ee",
    meanings: [
      {
        definition: "Required by law or rules",
        example: "Attendance in class is mandatory for all students.",
      },
      {
        definition: "Compulsory",
        example: "Wearing a helmet is mandatory for motorcyclists.",
      },
    ],
    synonyms: ["compulsory", "obligatory", "required", "necessary"],
    antonyms: ["optional", "voluntary", "elective"],
    typesOfUse: ["formal writing", "civics", "report"],
  },
  {
    id: "w069",
    word: "neutral",
    partOfSpeech: "adjective",
    pronunciation: "NYOO-trul",
    meanings: [
      {
        definition: "Not supporting either side in a conflict",
        example: "Switzerland remained neutral during World War II.",
      },
      {
        definition: "Having no distinctive characteristics",
        example: "She wore a neutral expression during the discussion.",
      },
    ],
    synonyms: ["impartial", "unbiased", "detached", "nonpartisan"],
    antonyms: ["biased", "partial", "prejudiced"],
    typesOfUse: ["formal writing", "history essay", "debate"],
  },
  {
    id: "w070",
    word: "obsolete",
    partOfSpeech: "adjective",
    pronunciation: "ob-suh-LEET",
    meanings: [
      {
        definition: "No longer produced or used; out of date",
        example: "Floppy disks have become obsolete in modern computing.",
      },
      {
        definition: "Fallen into disuse",
        example: "Some old vocabulary words are now considered obsolete.",
      },
    ],
    synonyms: ["outdated", "old-fashioned", "antiquated", "outmoded"],
    antonyms: ["modern", "current", "contemporary"],
    typesOfUse: ["formal writing", "technology essay", "report"],
  },
  {
    id: "w071",
    word: "pacify",
    partOfSpeech: "verb",
    pronunciation: "PAS-ih-fy",
    meanings: [
      {
        definition: "Bring peace to a conflict",
        example: "The teacher tried to pacify the angry students.",
      },
      {
        definition: "Calm someone who is agitated",
        example: "He pacified his younger sibling with kind words.",
      },
    ],
    synonyms: ["calm", "soothe", "appease", "settle"],
    antonyms: ["provoke", "agitate", "anger"],
    typesOfUse: ["formal writing", "essay", "character writing"],
  },
  {
    id: "w072",
    word: "pragmatic",
    partOfSpeech: "adjective",
    pronunciation: "prag-MAT-ik",
    meanings: [
      {
        definition: "Dealing with things practically",
        example: "A pragmatic approach to studying helps save time.",
      },
      {
        definition: "Guided by practical considerations",
        example: "She made a pragmatic decision to focus on weaker subjects.",
      },
    ],
    synonyms: ["practical", "realistic", "sensible", "rational"],
    antonyms: ["idealistic", "impractical", "unrealistic"],
    typesOfUse: ["formal essay", "speech", "character description"],
  },
  {
    id: "w073",
    word: "rational",
    partOfSpeech: "adjective",
    pronunciation: "RASH-un-ul",
    meanings: [
      {
        definition: "Based on reason or logic",
        example: "Make a rational decision based on the facts.",
      },
      {
        definition: "Able to think clearly and sensibly",
        example: "A rational student remains calm during an exam.",
      },
    ],
    synonyms: ["logical", "sensible", "reasonable", "sound"],
    antonyms: ["irrational", "illogical", "unreasonable"],
    typesOfUse: ["formal writing", "argument essay", "debate"],
  },
  {
    id: "w074",
    word: "stimulate",
    partOfSpeech: "verb",
    pronunciation: "STIM-yuh-late",
    meanings: [
      {
        definition: "Raise levels of activity in someone",
        example: "Reading stimulates the brain and improves concentration.",
      },
      {
        definition: "Encourage interest in something",
        example: "The teacher tried to stimulate curiosity in her students.",
      },
    ],
    synonyms: ["encourage", "inspire", "motivate", "excite"],
    antonyms: ["discourage", "depress", "bore"],
    typesOfUse: ["formal writing", "essay", "science report"],
  },
  {
    id: "w075",
    word: "tenacious",
    partOfSpeech: "adjective",
    pronunciation: "tuh-NAY-shus",
    meanings: [
      {
        definition: "Holding firmly to a position or principle",
        example: "She was tenacious in her pursuit of top marks.",
      },
      {
        definition: "Not giving up easily",
        example: "A tenacious attitude helps overcome academic challenges.",
      },
    ],
    synonyms: ["persistent", "determined", "stubborn", "resolute"],
    antonyms: ["weak", "yielding", "irresolute"],
    typesOfUse: ["character description", "motivational essay", "speech"],
  },
  {
    id: "w076",
    word: "undermine",
    partOfSpeech: "verb",
    pronunciation: "un-der-MINE",
    meanings: [
      {
        definition: "Damage or weaken gradually",
        example: "Constant distraction can undermine a student's focus.",
      },
      {
        definition: "Lessen the effectiveness of something",
        example: "He tried to undermine her argument with counter-evidence.",
      },
    ],
    synonyms: ["weaken", "subvert", "sabotage", "impair"],
    antonyms: ["strengthen", "support", "boost"],
    typesOfUse: ["formal writing", "argument essay", "debate"],
  },
  {
    id: "w077",
    word: "vague",
    partOfSpeech: "adjective",
    pronunciation: "VAYG",
    meanings: [
      {
        definition: "Not clearly expressed or felt",
        example: "The question was too vague to answer confidently.",
      },
      {
        definition: "Imprecise and inexact",
        example: "She gave a vague reply that raised more questions.",
      },
    ],
    synonyms: ["unclear", "ambiguous", "hazy", "imprecise"],
    antonyms: ["clear", "precise", "definite"],
    typesOfUse: ["formal writing", "essay", "exam answer"],
  },
  {
    id: "w078",
    word: "wary",
    partOfSpeech: "adjective",
    pronunciation: "WAIR-ee",
    meanings: [
      {
        definition: "Feeling cautious about possible dangers",
        example: "Be wary of unreliable sources while researching.",
      },
      {
        definition: "On guard against something",
        example: "She was wary of making careless mistakes in the exam.",
      },
    ],
    synonyms: ["cautious", "careful", "vigilant", "guarded"],
    antonyms: ["careless", "reckless", "trusting"],
    typesOfUse: ["formal writing", "character description", "essay"],
  },
  {
    id: "w079",
    word: "yearn",
    partOfSpeech: "verb",
    pronunciation: "YERN",
    meanings: [
      {
        definition: "Have an intense feeling of longing",
        example: "She yearned for a good result in her board exams.",
      },
      {
        definition: "Desire something strongly",
        example: "He yearned to understand the deeper meaning of the poem.",
      },
    ],
    synonyms: ["long", "desire", "crave", "wish"],
    antonyms: ["dislike", "reject", "avoid"],
    typesOfUse: ["creative writing", "essay", "literary analysis"],
  },
  {
    id: "w080",
    word: "zealous",
    partOfSpeech: "adjective",
    pronunciation: "ZEL-us",
    meanings: [
      {
        definition: "Having great energy in pursuit of a cause",
        example: "She was a zealous student who never missed revision.",
      },
      {
        definition: "Fervent and enthusiastic",
        example: "His zealous effort in science impressed his teacher.",
      },
    ],
    synonyms: ["enthusiastic", "eager", "passionate", "fervent"],
    antonyms: ["apathetic", "indifferent", "lazy"],
    typesOfUse: ["formal writing", "character description", "essay"],
  },
  {
    id: "w081",
    word: "assert",
    partOfSpeech: "verb",
    pronunciation: "uh-SERT",
    meanings: [
      {
        definition: "State a fact or belief confidently",
        example: "The author asserts that education is a basic right.",
      },
      {
        definition: "Make a claim about something",
        example:
          "She asserted that her interpretation of the text was correct.",
      },
    ],
    synonyms: ["declare", "state", "claim", "insist"],
    antonyms: ["deny", "retract", "withdraw"],
    typesOfUse: ["formal writing", "argument essay", "debate"],
  },
  {
    id: "w082",
    word: "bias",
    partOfSpeech: "noun",
    pronunciation: "BY-us",
    meanings: [
      {
        definition: "Preference for or against one thing or group",
        example: "A good writer should be free from bias in their argument.",
      },
      {
        definition: "Unfair personal opinion affecting judgment",
        example: "The report was criticized for showing clear bias.",
      },
    ],
    synonyms: ["prejudice", "partiality", "favoritism", "slant"],
    antonyms: ["impartiality", "fairness", "objectivity"],
    typesOfUse: ["formal writing", "media analysis", "essay"],
  },
  {
    id: "w083",
    word: "coherent",
    partOfSpeech: "adjective",
    pronunciation: "koh-HEER-ent",
    meanings: [
      {
        definition: "Logically connected and consistent",
        example:
          "Write a coherent argument with a clear introduction and conclusion.",
      },
      {
        definition: "Able to speak clearly and logically",
        example: "Her coherent explanation helped everyone understand.",
      },
    ],
    synonyms: ["logical", "consistent", "clear", "organized"],
    antonyms: ["incoherent", "confusing", "disorganized"],
    typesOfUse: ["formal writing", "essay", "exam answer"],
  },
  {
    id: "w084",
    word: "cultivate",
    partOfSpeech: "verb",
    pronunciation: "KUL-tih-vate",
    meanings: [
      {
        definition: "Prepare and develop a skill or habit",
        example: "Cultivate the habit of reading every day.",
      },
      {
        definition: "Develop or foster an attitude",
        example: "Schools should cultivate a love of learning in students.",
      },
    ],
    synonyms: ["develop", "foster", "nurture", "grow"],
    antonyms: ["neglect", "ignore", "suppress"],
    typesOfUse: ["motivational writing", "essay", "formal speech"],
  },
  {
    id: "w085",
    word: "denounce",
    partOfSpeech: "verb",
    pronunciation: "dih-NOUNS",
    meanings: [
      {
        definition: "Publicly declare wrong or evil",
        example: "Leaders denounced the act of vandalism at the school.",
      },
      {
        definition: "Criticize strongly in public",
        example: "The report denounced the lack of funding for education.",
      },
    ],
    synonyms: ["condemn", "criticize", "oppose", "rebuke"],
    antonyms: ["praise", "support", "endorse"],
    typesOfUse: ["formal writing", "speech", "argument essay"],
  },
  {
    id: "w086",
    word: "evolve",
    partOfSpeech: "verb",
    pronunciation: "ih-VOLV",
    meanings: [
      {
        definition: "Develop gradually over time",
        example: "Languages evolve to reflect changes in society.",
      },
      {
        definition: "Develop from simple to complex forms",
        example: "Darwin argued that species evolve through natural selection.",
      },
    ],
    synonyms: ["develop", "grow", "progress", "advance"],
    antonyms: ["regress", "decline", "stagnate"],
    typesOfUse: ["science essay", "formal writing", "history essay"],
  },
  {
    id: "w087",
    word: "foresight",
    partOfSpeech: "noun",
    pronunciation: "FOR-site",
    meanings: [
      {
        definition: "The ability to predict what is needed",
        example: "Good foresight helps students plan their exam preparation.",
      },
      {
        definition: "Seeing or knowing beforehand",
        example: "Her foresight in revision helped her score well.",
      },
    ],
    synonyms: ["prudence", "forethought", "planning", "vision"],
    antonyms: ["hindsight", "shortsightedness", "recklessness"],
    typesOfUse: ["formal writing", "essay", "character description"],
  },
  {
    id: "w088",
    word: "gratitude",
    partOfSpeech: "noun",
    pronunciation: "GRAT-ih-tood",
    meanings: [
      {
        definition: "The quality of being thankful",
        example: "She expressed her gratitude to the teachers who helped her.",
      },
      {
        definition: "Readiness to show appreciation",
        example: "Gratitude is an important value in Indian culture.",
      },
    ],
    synonyms: ["thankfulness", "appreciation", "recognition", "gratefulness"],
    antonyms: ["ingratitude", "ungratefulness", "thanklessness"],
    typesOfUse: ["formal writing", "essay", "speech"],
  },
  {
    id: "w089",
    word: "harmonious",
    partOfSpeech: "adjective",
    pronunciation: "har-MOH-nee-us",
    meanings: [
      {
        definition: "Free from conflict; peaceful",
        example: "A harmonious classroom helps students concentrate better.",
      },
      {
        definition: "Forming a pleasing combination",
        example: "The harmonious blend of colors made the artwork beautiful.",
      },
    ],
    synonyms: ["peaceful", "congenial", "compatible", "balanced"],
    antonyms: ["discordant", "conflicting", "hostile"],
    typesOfUse: ["formal writing", "essay", "descriptive writing"],
  },
  {
    id: "w090",
    word: "illuminate",
    partOfSpeech: "verb",
    pronunciation: "ih-LOO-mih-nate",
    meanings: [
      {
        definition: "Make clearer and easier to understand",
        example: "The diagram illuminated the concept of photosynthesis.",
      },
      {
        definition: "Light up or shed light on",
        example: "The lanterns illuminated the entire hall.",
      },
    ],
    synonyms: ["clarify", "explain", "enlighten", "brighten"],
    antonyms: ["obscure", "confuse", "darken"],
    typesOfUse: ["formal writing", "essay", "literary analysis"],
  },
  {
    id: "w091",
    word: "integrate",
    partOfSpeech: "verb",
    pronunciation: "IN-tuh-grate",
    meanings: [
      {
        definition: "Combine into a whole",
        example: "Students should integrate knowledge from different subjects.",
      },
      {
        definition: "Bring together different groups",
        example: "The new policy aims to integrate all students equally.",
      },
    ],
    synonyms: ["combine", "merge", "incorporate", "blend"],
    antonyms: ["separate", "divide", "segregate"],
    typesOfUse: ["formal writing", "essay", "report"],
  },
  {
    id: "w092",
    word: "lament",
    partOfSpeech: "verb",
    pronunciation: "luh-MENT",
    meanings: [
      {
        definition: "Express deep sorrow or grief",
        example: "He lamented his poor performance in the mock test.",
      },
      {
        definition: "Mourn or grieve over",
        example: "She lamented the loss of precious study time.",
      },
    ],
    synonyms: ["mourn", "grieve", "regret", "deplore"],
    antonyms: ["celebrate", "rejoice", "cheer"],
    typesOfUse: ["literary writing", "formal essay", "descriptive writing"],
  },
  {
    id: "w093",
    word: "manifest",
    partOfSpeech: "verb",
    pronunciation: "MAN-ih-fest",
    meanings: [
      {
        definition: "Show clearly by evidence or action",
        example: "Her determination manifested in her consistent hard work.",
      },
      {
        definition: "Become apparent",
        example: "The symptoms of the illness began to manifest slowly.",
      },
    ],
    synonyms: ["reveal", "demonstrate", "display", "show"],
    antonyms: ["hide", "conceal", "suppress"],
    typesOfUse: ["formal writing", "essay", "literary analysis"],
  },
  {
    id: "w094",
    word: "obstacle",
    partOfSpeech: "noun",
    pronunciation: "OB-stuh-kul",
    meanings: [
      {
        definition: "A thing that blocks progress",
        example: "Lack of resources is an obstacle to quality education.",
      },
      {
        definition: "A difficulty to be overcome",
        example: "Every obstacle is a chance to grow stronger.",
      },
    ],
    synonyms: ["barrier", "hindrance", "challenge", "hurdle"],
    antonyms: ["aid", "help", "advantage"],
    typesOfUse: ["motivational essay", "formal writing", "speech"],
  },
  {
    id: "w095",
    word: "persevere",
    partOfSpeech: "verb",
    pronunciation: "per-suh-VEER",
    meanings: [
      {
        definition: "Continue despite difficulty",
        example: "She persevered in her studies despite many challenges.",
      },
      {
        definition: "Persist steadfastly",
        example: "Persevere with your revision even when it feels hard.",
      },
    ],
    synonyms: ["persist", "endure", "continue", "press on"],
    antonyms: ["give up", "quit", "abandon"],
    typesOfUse: ["motivational essay", "speech", "character writing"],
  },
  {
    id: "w096",
    word: "refute",
    partOfSpeech: "verb",
    pronunciation: "rih-FYOOT",
    meanings: [
      {
        definition: "Prove a statement to be wrong",
        example: "Use evidence to refute the opposing argument.",
      },
      {
        definition: "Deny the truth of something",
        example: "She refuted the claim with solid facts.",
      },
    ],
    synonyms: ["disprove", "counter", "rebut", "challenge"],
    antonyms: ["confirm", "support", "validate"],
    typesOfUse: ["argument essay", "debate", "formal writing"],
  },
  {
    id: "w097",
    word: "eloquence",
    partOfSpeech: "noun",
    pronunciation: "EL-oh-kwence",
    meanings: [
      {
        definition: "Fluent and persuasive speech or writing",
        example: "She spoke with great eloquence during the debate.",
      },
      {
        definition: "The art of speaking effectively",
        example: "Eloquence is a key skill for public speaking.",
      },
    ],
    synonyms: ["fluency", "articulacy", "persuasiveness", "rhetoric"],
    antonyms: ["inarticulacy", "hesitance", "mumbling"],
    typesOfUse: ["speech", "formal writing", "literary analysis"],
  },
  {
    id: "w098",
    word: "nominate",
    partOfSpeech: "verb",
    pronunciation: "NOM-ih-nate",
    meanings: [
      {
        definition: "Propose someone for an official position",
        example: "She was nominated as class representative by her peers.",
      },
      {
        definition: "Formally enter a candidate for election",
        example: "He was nominated for the best student award.",
      },
    ],
    synonyms: ["propose", "put forward", "select", "designate"],
    antonyms: ["withdraw", "reject", "disqualify"],
    typesOfUse: ["formal writing", "civics", "report"],
  },
  {
    id: "w099",
    word: "substantiate",
    partOfSpeech: "verb",
    pronunciation: "sub-STAN-shee-ate",
    meanings: [
      {
        definition: "Provide evidence to support or prove the truth of",
        example: "Substantiate your argument with relevant quotations.",
      },
      {
        definition: "Give substance to",
        example: "She substantiated her claim with statistical data.",
      },
    ],
    synonyms: ["support", "prove", "verify", "confirm"],
    antonyms: ["deny", "disprove", "contradict"],
    typesOfUse: ["formal writing", "essay", "argument"],
  },
  {
    id: "w100",
    word: "culminate",
    partOfSpeech: "verb",
    pronunciation: "KUL-mih-nate",
    meanings: [
      {
        definition: "Reach a climax or point of highest development",
        example: "Years of hard work culminated in a top score in board exams.",
      },
      {
        definition: "Come to a conclusion",
        example: "The festival culminated with an awards ceremony.",
      },
    ],
    synonyms: ["peak", "climax", "conclude", "reach a high point"],
    antonyms: ["begin", "start", "commence"],
    typesOfUse: ["formal writing", "essay", "speech"],
  },
];
