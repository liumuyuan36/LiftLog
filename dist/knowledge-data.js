// Original short Chinese paraphrases; source audits: research/fitness-source-*.json.
export const KNOWLEDGE_VERSION='fitness-notes-2026-11-14-v3';
export const sources={
  "A": {
    "title": "ACSM Unveils Landmark 2026 Resistance Training Guidelines — First Update in 17 Years",
    "url": "https://acsm.org/resistance-training-guidelines-update-2026/",
    "year": 2026,
    "type": "专业组织",
    "accessedAt": "2026-11-14",
    "readStatus": "official_summary_read",
    "evidenceType": "professional_organization_summary",
    "population": "Generally healthy adults; the summary is not an individualized plan",
    "assessment": "Existing Chinese label and 2026 year are appropriate. It must stay identified as the official summary, not a full-text review of the position stand. Approximate weekly sets and general frequency statements must not become mandatory novice targets.",
    "independentReview": "not-performed"
  },
  "B": {
    "title": "Influence of Resistance Training Proximity-to-Failure on Skeletal Muscle Hypertrophy: A Systematic Review with Meta-analysis",
    "url": "https://pubmed.ncbi.nlm.nih.gov/36334240/",
    "year": 2023,
    "type": "研究综述",
    "onlineYear": 2022,
    "doi": "10.1007/s40279-022-01784-y",
    "accessedAt": "2026-11-14",
    "readStatus": "author_abstract_read",
    "evidenceType": "systematic_review_meta_analysis",
    "assessment": "2023 is the journal publication year. Preserve uncertainty from different definitions of failure and study protocols; absence of consistent failure superiority does not establish that effort is irrelevant.",
    "independentReview": "not-performed"
  },
  "C": {
    "title": "Application of the Repetitions in Reserve-Based Rating of Perceived Exertion Scale for Resistance Training",
    "url": "https://pubmed.ncbi.nlm.nih.gov/27531969/",
    "year": 2016,
    "type": "方法应用综述",
    "fullTextUrl": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4961270/",
    "authors": "Eric R Helms, John Cronin, Adam Storey, Michael C Zourdos",
    "doi": "10.1519/SSC.0000000000000218",
    "accessedAt": "2026-11-14",
    "readStatus": "selected_full_text_sections_read",
    "evidenceType": "method_application_review",
    "assessment": "Title/year correct. Prefer 方法应用综述 to an undifferentiated 研究文章 label: this is an application article, not a new controlled efficacy trial.",
    "independentReview": "not-performed"
  },
  "D": {
    "title": "Estimating Repetitions in Reserve in Four Commonly Used Resistance Exercises",
    "url": "https://pubmed.ncbi.nlm.nih.gov/33337690/",
    "year": 2020,
    "type": "研究文章",
    "authors": "Liam J Hughes, Jeremiah J Peiffer, Brendan Scott",
    "onlinePublishedAt": "2020-12-17",
    "publicationYearBasis": "online ahead of print date shown by PubMed; no print year inferred",
    "doi": "10.1519/JSC.0000000000003865",
    "accessedAt": "2026-11-14",
    "readStatus": "author_abstract_read",
    "evidenceType": "repeated_measures_experiment",
    "population": "21 resistance-trained men; squat, bench press, overhead press and prone row; free-weight and Smith-machine conditions; estimated 2RIR at 65/75/85%1RM",
    "assessment": "This PMID is correctly linked and the existing 2020 date is defensible as online publication. Accuracy was greatest at the heaviest tested load; do not generalize the exact result to beginners, women, all RIR values or every exercise. The experiment is about estimation accuracy, not which equipment grows more muscle.",
    "independentReview": "not-performed"
  },
  "E": {
    "title": "Give it a rest: a systematic review with Bayesian meta-analysis on the effect of inter-set rest interval duration on muscle hypertrophy",
    "url": "https://pubmed.ncbi.nlm.nih.gov/39205815/",
    "year": 2024,
    "type": "研究综述",
    "fullTextUrl": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11349676/",
    "doi": "10.3389/fspor.2024.1429789",
    "accessedAt": "2026-11-14",
    "readStatus": "author_abstract_read",
    "evidenceType": "systematic_review_bayesian_meta_analysis",
    "population": "Healthy adult studies; nine studies and 19 hypertrophy measurements",
    "assessment": "Existing source identity/year correct. Consider replacing the F08 clause with 超过90秒后未观察到明确差异，但估计区间重叠且研究有异质性; this is not proof of an optimal 90-second rest or proof that longer rest is useless.",
    "independentReview": "not-performed"
  },
  "F": {
    "title": "Dietary Supplements for Exercise and Athletic Performance: Fact Sheet for Health Professionals",
    "url": "https://ods.od.nih.gov/factsheets/ExerciseAndAthleticPerformance-HealthProfessional/",
    "year": 2024,
    "type": "官方资料",
    "updatedAt": "2024-04-01",
    "accessedAt": "2026-11-14",
    "readStatus": "selected_official_sections_read",
    "sectionsRead": [
      "Introduction",
      "Creatine: Efficacy and Safety",
      "Protein",
      "Selected Ingredients: combination-product limitation",
      "Regulation",
      "Updated footer"
    ],
    "evidenceType": "official_evidence_fact_sheet",
    "assessment": "Existing year:null can be replaced with 2024 only if labeled page update year. Do not imply a 2024 original trial. US FDA regulation text is US-specific and should not be used as a statement of Chinese regulation.",
    "independentReview": "not-performed"
  },
  "G": {
    "title": "Delayed Onset Muscle Soreness (DOMS)",
    "url": "https://www.acsm.org/docs/default-source/files-for-resource-library/delayed-onset-muscle-soreness-%28doms%29.pdf",
    "year": null,
    "type": "专业组织",
    "accessedAt": "2026-11-14",
    "readStatus": "unavailable_on_this_review_attempt",
    "evidenceType": "professional_organization_information_sheet",
    "assessment": "The legacy URL redirected to an unavailable ACSM URL in this review. Do not claim its full text was reverified today or invent its publication year. Preserve prior provenance or replace with a reachable official copy before marking this source verified. New soreness cards below instead cite accessible original studies.",
    "independentReview": "not-performed"
  },
  "P": {
    "title": "LiftLog 记录与统计口径",
    "url": "https://github.com/liumuyuan36/LiftLog/blob/main/dist/data.js",
    "year": 2026,
    "type": "产品规范",
    "readStatus": "product_specification",
    "evidenceType": "product_specification"
  },
  "V": {
    "title": "LiftLog 外形口语词表与处理范围",
    "url": "https://github.com/liumuyuan36/LiftLog/blob/main/training/atlas/vocabulary/fitness-lexicon.zh-CN.json",
    "year": 2026,
    "type": "产品规范",
    "readStatus": "product_specification",
    "evidenceType": "product_specification"
  },
  "H": {
    "url": "https://pubmed.ncbi.nlm.nih.gov/33874848/",
    "title": "Influence of resistance training load on measures of skeletal muscle hypertrophy and improvements in maximal strength and neuromuscular task performance: A systematic review and meta-analysis",
    "authors": "Martin C Refalo, D Lee Hamilton, D Robert Paval, Iain J Gallagher, Simon A Feros, Jackson J Fyfe",
    "year": 2021,
    "doi": "10.1080/02640414.2021.1898094",
    "accessedAt": "2026-11-14",
    "readStatus": "author_abstract_read_in_search_result; later direct fetch returned incomplete page",
    "evidenceType": "systematic_review_meta_analysis",
    "scope": "45 studies comparing higher and lower resistance-training loads; outcomes include hypertrophy and maximal strength",
    "independentReview": "not-performed",
    "type": "systematic_review_meta_analysis"
  },
  "I": {
    "url": "https://pubmed.ncbi.nlm.nih.gov/34170576/",
    "publisherUrl": "https://onlinelibrary.wiley.com/doi/full/10.1111/sms.14006",
    "title": "Effects of range of motion on resistance training adaptations: A systematic review and meta-analysis",
    "authors": "Jesús G Pallarés et al.",
    "year": 2021,
    "doi": "10.1111/sms.14006",
    "accessedAt": "2026-11-14",
    "readStatus": "author_abstract_and_selected_publisher_methods_results_read",
    "evidenceType": "systematic_review_meta_analysis",
    "scope": "16 studies, healthy adults; searches through March 2021; strongest hypertrophy conclusion concerns lower limbs",
    "independentReview": "not-performed",
    "type": "systematic_review_meta_analysis"
  },
  "J": {
    "url": "https://pubmed.ncbi.nlm.nih.gov/36662126/",
    "title": "Which ROMs Lead to Rome? A Systematic Review of the Effects of Range of Motion on Muscle Hypertrophy",
    "authors": "Witalo Kassiano et al.",
    "year": 2023,
    "doi": "10.1519/JSC.0000000000004415",
    "accessedAt": "2026-11-14",
    "readStatus": "author_abstract_read",
    "evidenceType": "systematic_review",
    "scope": "11 studies through April 2022; muscle-specific and regional effects of full and partial movement ranges",
    "independentReview": "not-performed",
    "type": "systematic_review"
  },
  "K": {
    "url": "https://pubmed.ncbi.nlm.nih.gov/36622555/",
    "title": "Resistance Training Induces Improvements in Range of Motion: A Systematic Review and Meta-Analysis",
    "authors": "Shahab Alizadeh et al.",
    "year": 2023,
    "doi": "10.1007/s40279-022-01804-x",
    "accessedAt": "2026-11-14",
    "readStatus": "author_abstract_read",
    "evidenceType": "systematic_review_meta_analysis",
    "scope": "55 controlled/randomized studies in healthy participants; joint flexibility outcome, not muscle growth",
    "independentReview": "not-performed",
    "type": "systematic_review_meta_analysis"
  },
  "L": {
    "url": "https://pubmed.ncbi.nlm.nih.gov/38595233/",
    "title": "Efficacy of Split Versus Full-Body Resistance Training on Strength and Muscle Growth: A Systematic Review With Meta-Analysis",
    "authors": "Domingo J Ramos-Campo et al.",
    "year": 2024,
    "doi": "10.1519/JSC.0000000000004774",
    "accessedAt": "2026-11-14",
    "readStatus": "author_abstract_read",
    "evidenceType": "systematic_review_meta_analysis",
    "scope": "14 studies, 392 healthy adults; split versus full-body programs with volume equated",
    "independentReview": "not-performed",
    "type": "systematic_review_meta_analysis"
  },
  "M": {
    "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC8884877/",
    "pubmedUrl": "https://pubmed.ncbi.nlm.nih.gov/35291645/",
    "title": "A Systematic Review of The Effects of Different Resistance Training Volumes on Muscle Hypertrophy",
    "authors": "Eneko Baz-Valle, Carlos Balsalobre-Fernández, Carlos Alix-Fages, Jordan Santos-Concejero",
    "year": 2022,
    "doi": "10.2478/hukin-2022-0017",
    "accessedAt": "2026-11-14",
    "readStatus": "abstract_methods_selected_results_and_discussion_read",
    "evidenceType": "systematic_review_meta_analysis",
    "scope": "Seven qualitative/six quantitative studies; young trained men, generally 18–35 and at least one year of training; interventions at least six weeks",
    "qualityFlag": "Triceps quantitative-results text reports p=.01 but its printed CI crosses zero; do not turn that apparent inconsistency into a firm triceps prescription. The conservative card uses only the non-significant quadriceps/biceps comparison.",
    "independentReview": "not-performed",
    "type": "systematic_review_meta_analysis"
  },
  "N": {
    "url": "https://pubmed.ncbi.nlm.nih.gov/35438660/",
    "title": "Does Varying Resistance Exercises Promote Superior Muscle Hypertrophy and Strength Gains? A Systematic Review",
    "authors": "Witalo Kassiano et al.",
    "year": 2022,
    "doi": "10.1519/JSC.0000000000004258",
    "accessedAt": "2026-11-14",
    "readStatus": "author_abstract_read",
    "evidenceType": "systematic_review",
    "scope": "Eight studies, 241 participants, all young men; systematic versus excessive/random exercise variation",
    "independentReview": "not-performed",
    "type": "systematic_review"
  },
  "O": {
    "url": "https://pubmed.ncbi.nlm.nih.gov/28698222/",
    "title": "A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults",
    "authors": "Robert W Morton et al.",
    "year": 2018,
    "onlineYear": 2017,
    "doi": "10.1136/bjsports-2017-097608",
    "accessedAt": "2026-11-14",
    "readStatus": "author_abstract_and_2020_correction_read",
    "correctionUrl": "https://pmc.ncbi.nlm.nih.gov/articles/PMC7513243/",
    "correctionNote": "2020 correction adds a supplement-industry advisory-board competing-interest declaration; it does not announce a changed efficacy estimate.",
    "evidenceType": "systematic_review_meta_analysis_meta_regression",
    "scope": "49 trials, 1863 healthy adults; resistance exercise interventions lasting at least six weeks with protein supplementation",
    "independentReview": "not-performed",
    "type": "systematic_review_meta_analysis_meta_regression"
  },
  "Q": {
    "url": "https://pubmed.ncbi.nlm.nih.gov/12453160/",
    "title": "Delayed-onset muscle soreness does not reflect the magnitude of eccentric exercise-induced muscle damage",
    "authors": "Kazunori Nosaka, Mike Newton, Paul Sacco",
    "year": 2002,
    "doi": "10.1034/j.1600-0838.2002.10178.x",
    "accessedAt": "2026-11-14",
    "readStatus": "author_abstract_read",
    "evidenceType": "controlled_experimental_study",
    "scope": "110 male students, maximal eccentric elbow-flexor actions; soreness and indirect damage markers followed for four days",
    "independentReview": "not-performed",
    "type": "controlled_experimental_study"
  },
  "R": {
    "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC59671/",
    "title": "Time course of muscle soreness following different types of exercise",
    "year": 2001,
    "pmid": "11701094",
    "accessedAt": "2026-11-14",
    "readStatus": "author_abstract_read",
    "evidenceType": "secondary_analysis_of_original_trial_data",
    "scope": "400 long-distance runners and 82 untrained bench-stepping volunteers; soreness followed for five days; exercise and population differ between groups",
    "independentReview": "not-performed",
    "type": "secondary_analysis_of_original_trial_data"
  },
  "S": {
    "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC6724585/",
    "title": "Similar Muscular Adaptations in Resistance Training Performed Two Versus Three Days Per Week",
    "authors": "Thiago Lasevicius et al.",
    "year": 2019,
    "doi": "10.2478/hukin-2019-0062",
    "accessedAt": "2026-11-14",
    "readStatus": "abstract_and_selected_methods_read",
    "evidenceType": "randomized_parallel_trial",
    "scope": "36 trained men randomized, 28 completed; ten weeks; muscle-group frequency two versus three days with weekly volume equated",
    "independentReview": "not-performed",
    "type": "randomized_parallel_trial"
  },
  "T": {
    "url": "https://pubmed.ncbi.nlm.nih.gov/37414459/",
    "title": "Resistance training prescription for muscle strength and hypertrophy in healthy adults: a systematic review and Bayesian network meta-analysis",
    "authors": "Brad S Currier et al.",
    "year": 2023,
    "doi": "10.1136/bjsports-2023-106807",
    "accessedAt": "2026-11-14",
    "readStatus": "author_abstract_read",
    "evidenceType": "systematic_review_bayesian_network_meta_analysis",
    "scope": "Healthy adult randomized trials; strength network 178 studies/5097 people; hypertrophy network 119 studies/3364 people",
    "independentReview": "not-performed",
    "type": "systematic_review_bayesian_network_meta_analysis"
  },
  "U": {
    "url": "https://pubmed.ncbi.nlm.nih.gov/34881412/",
    "title": "Effects of Resistance Training to Muscle Failure on Acute Fatigue: A Systematic Review and Meta-Analysis",
    "authors": "João Guilherme Vieira et al.",
    "year": 2022,
    "onlineYear": 2021,
    "doi": "10.1007/s40279-021-01602-x",
    "accessedAt": "2026-11-14",
    "readStatus": "complete_author_abstract_read_in_PubMed_search_result",
    "evidenceType": "systematic_review_meta_analysis",
    "scope": "Twenty crossover studies reviewed/twelve pooled; acute biomechanical, metabolic, indirect damage and perceived-exertion outcomes",
    "independentReview": "not-performed",
    "type": "systematic_review_meta_analysis"
  },
  "W": {
    "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC9528903/",
    "title": "Progressive overload without progressing load? The effects of load or repetition progression on muscular adaptations",
    "authors": "Daniel Plotkin et al.",
    "year": 2022,
    "doi": "10.7717/peerj.14142",
    "accessedAt": "2026-11-14",
    "readStatus": "abstract_training_methods_and_measurement_sections_read",
    "evidenceType": "randomized_parallel_trial",
    "scope": "43 resistance-trained adults randomized; eight-week supervised lower-body program; load progression versus repetition progression; ultrasound muscle thickness measured at standardized sites after a rest interval",
    "independentReview": "not-performed",
    "type": "randomized_parallel_trial"
  },
  "X01": {
    "title": "How Slow Should You Go? A Systematic Review With Meta-Analysis of the Effect of Resistance Training Repetition Tempo on Muscle Hypertrophy",
    "url": "https://pubmed.ncbi.nlm.nih.gov/42709703/",
    "year": 2025,
    "doi": "10.1519/JSC.0000000000005302",
    "authors": "Alysson Enes et al.",
    "evidenceType": "systematic_review_bayesian_meta_analysis",
    "readStatus": "complete_author_abstract_read_in_PubMed_search_result; direct page fetch incomplete",
    "accessedAt": "2026-11-14",
    "population": "Healthy adults; 14 studies manipulating eccentric/concentric tempo while controlling other training variables",
    "sourceSection": "Abstract: inclusion, tempo coding and pairwise estimates",
    "type": "systematic_review_bayesian_meta_analysis"
  },
  "X02": {
    "title": "What influence does resistance exercise order have on muscular strength gains and muscle hypertrophy? A systematic review and meta-analysis",
    "url": "https://onlinelibrary.wiley.com/doi/10.1080/17461391.2020.1733672",
    "pubmedUrl": "https://pubmed.ncbi.nlm.nih.gov/32077380/",
    "year": 2021,
    "onlineYear": 2020,
    "doi": "10.1080/17461391.2020.1733672",
    "authors": "João Pedro Nunes et al.",
    "evidenceType": "systematic_review_meta_analysis",
    "readStatus": "publisher_abstract_and_metadata_read",
    "accessedAt": "2026-11-14",
    "population": "Eleven studies of exercise order and longitudinal strength/hypertrophy outcomes",
    "sourceSection": "Abstract; journal issue February 2021; first online February 2020",
    "type": "systematic_review_meta_analysis"
  },
  "X03": {
    "title": "Energy deficiency impairs resistance training gains in lean mass but not strength: A meta-analysis and meta-regression",
    "url": "https://pubmed.ncbi.nlm.nih.gov/34623696/",
    "year": 2022,
    "onlineYear": 2021,
    "doi": "10.1111/sms.14075",
    "authors": "Chaise Murphy, Karsten Koehler",
    "evidenceType": "systematic_review_meta_analysis_meta_regression",
    "readStatus": "author_abstract_read",
    "accessedAt": "2026-11-14",
    "population": "Resistance training trials lasting at least three weeks under energy deficit; lean mass and strength outcomes",
    "sourceSection": "Abstract: analyses A/B and conclusion",
    "type": "systematic_review_meta_analysis_meta_regression"
  },
  "X04": {
    "title": "The Effect of Carbohydrate Intake on Strength and Resistance Training Performance: A Systematic Review",
    "url": "https://www.mdpi.com/2072-6643/14/4/856",
    "pubmedUrl": "https://pubmed.ncbi.nlm.nih.gov/35215506/",
    "year": 2022,
    "doi": "10.3390/nu14040856",
    "authors": "Menno Henselmans, Thomas Bjørnsen, Richie Hedderman, Fredrik Tonstad Vårvik",
    "evidenceType": "systematic_review",
    "readStatus": "publisher_abstract_and_selected_eligibility_results_read",
    "accessedAt": "2026-11-14",
    "population": "49 acute, glycogen-depletion, short-term and longer-term studies; mostly trainees/athletes; varied fed/fasted and volume conditions",
    "sourceSection": "Abstract; Methods 2.2; acute training results",
    "type": "systematic_review"
  },
  "X05": {
    "title": "Accuracy of Smart Scales on Weight and Body Composition: Observational Study",
    "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC8122302/",
    "year": 2021,
    "doi": "10.2196/22487",
    "authors": "Justine Frija-Masson et al.",
    "evidenceType": "cross_sectional_device_validation",
    "readStatus": "abstract_introduction_and_selected_methods_read; later fetch encountered browser check",
    "accessedAt": "2026-11-14",
    "population": "Adult patients referred to a French tertiary hospital for DXA; three specific foot-to-foot consumer scale models, with 48–53 patients per model",
    "sourceSection": "Abstract; Introduction: impedance estimation model; Methods: patients",
    "limitation": "Hospital sample and three older models; do not generalize exact error to every present-day scale or healthy athlete.",
    "type": "cross_sectional_device_validation"
  },
  "X06": {
    "title": "Effect of Small and Large Energy Surpluses on Strength, Muscle, and Skinfold Thickness in Resistance-Trained Individuals: A Parallel Groups Design",
    "url": "https://pubmed.ncbi.nlm.nih.gov/37914977/",
    "year": 2023,
    "doi": "10.1186/s40798-023-00651-y",
    "authors": "Eric R Helms et al.",
    "evidenceType": "randomized_parallel_trial",
    "readStatus": "author_abstract_and_selected_author_discussion_in_search_result_read",
    "accessedAt": "2026-11-14",
    "population": "21 trained lifters randomized; 17 completed eight weeks; three intended energy-intake groups",
    "sourceSection": "Abstract: participant attrition, regression and limitations; Discussion: intended versus achieved surplus",
    "limitation": "Small sample; actual surplus separation between moderate/high groups was imperfect; associations from regression are not a universal personal gain-rate target.",
    "type": "randomized_parallel_trial"
  },
  "X07": {
    "title": "Greater Hamstrings Muscle Hypertrophy but Similar Damage Protection after Training at Long versus Short Muscle Lengths",
    "url": "https://pubmed.ncbi.nlm.nih.gov/33009197/",
    "year": 2021,
    "doi": "10.1249/MSS.0000000000002523",
    "authors": "Sumiaki Maeo et al.",
    "evidenceType": "within_person_training_experiment",
    "readStatus": "author_abstract_and_selected_original_results_discussion_read",
    "accessedAt": "2026-11-14",
    "population": "Twenty healthy adults; twelve weeks of seated leg curl in one leg and prone leg curl in the other; MRI muscle volume",
    "sourceSection": "Abstract: Part 1; original discussion on regional and biarticular findings",
    "type": "within_person_training_experiment"
  },
  "X08": {
    "title": "Effects of Horizontal and Incline Bench Press on Neuromuscular Adaptations in Untrained Young Men",
    "url": "https://pubmed.ncbi.nlm.nih.gov/32922646/",
    "publisherUrl": "https://intjexersci.com/files/ijes/vol13/iss6/12.pdf",
    "year": 2020,
    "authors": "Suene F N Chaves et al.",
    "evidenceType": "randomized_parallel_trial",
    "readStatus": "complete_author_abstract_read_in_PubMed_and_journal_search_result",
    "accessedAt": "2026-11-14",
    "population": "47 untrained young men; eight weeks, once weekly; equal set counts; horizontal, incline, or combined bench press",
    "sourceSection": "Abstract: three measurement sites and general strength results",
    "type": "randomized_parallel_trial"
  },
  "X09": {
    "title": "Dumbbell versus cable lateral raises for lateral deltoid hypertrophy: an experimental study",
    "url": "https://pubmed.ncbi.nlm.nih.gov/40692697/",
    "year": 2025,
    "doi": "10.3389/fphys.2025.1611468",
    "authors": "Stian Larsen et al.",
    "evidenceType": "randomized_within_person_trial",
    "readStatus": "complete_author_abstract_read_in_PubMed_search_result",
    "accessedAt": "2026-11-14",
    "population": "24 trained men and women completed eight weeks; arms randomized; matched shoulder range of motion",
    "sourceSection": "Abstract: standardized ROM, intervention, Bayesian comparison",
    "type": "randomized_within_person_trial"
  },
  "X10": {
    "title": "Effects of grip width on muscle strength and activation in the lat pull-down",
    "url": "https://pubmed.ncbi.nlm.nih.gov/24662157/",
    "year": 2014,
    "doi": "10.1097/JSC.0000000000000232",
    "authors": "Vidar Andersen et al.",
    "evidenceType": "acute_randomized_counterbalanced_experiment",
    "readStatus": "author_abstract_methods_and_conclusion_read_in_primary_search_results; publisher fetch payment wall",
    "accessedAt": "2026-11-14",
    "population": "15 men; three pronated grip widths; six-repetition maximum and EMG measurements",
    "sourceSection": "Abstract: study design and similar activation conclusion",
    "limitation": "The paper's forecast of similar hypertrophy is an inference, not a measured longitudinal hypertrophy outcome.",
    "type": "acute_randomized_counterbalanced_experiment"
  },
  "X11": {
    "title": "Effects of squat training with different depths on lower limb muscle volumes",
    "url": "https://pubmed.ncbi.nlm.nih.gov/31230110/",
    "year": 2019,
    "doi": "10.1007/s00421-019-04181-y",
    "authors": "Keitaro Kubo, Toshihiro Ikebukuro, Hideaki Yata",
    "evidenceType": "randomized_parallel_trial",
    "readStatus": "author_abstract_read",
    "accessedAt": "2026-11-14",
    "population": "17 men; ten weeks of full or half squats; MRI muscle volumes",
    "sourceSection": "Abstract: muscle-specific results",
    "type": "randomized_parallel_trial"
  },
  "X13": {
    "title": "Sex differences in absolute and relative changes in muscle size following resistance training in healthy adults: a systematic review with Bayesian meta-analysis",
    "url": "https://pubmed.ncbi.nlm.nih.gov/40028215/",
    "publisherUrl": "https://doi.org/10.7717/peerj.19042",
    "year": 2025,
    "doi": "10.7717/peerj.19042",
    "authors": "Martin C Refalo et al.",
    "evidenceType": "systematic_review_bayesian_meta_analysis",
    "readStatus": "complete_author_abstract_read_in_public_author_manuscript_search_result; publisher fetch forbidden",
    "accessedAt": "2026-11-14",
    "population": "29 studies; healthy men and women aged 18–45 doing the same training intervention",
    "sourceSection": "Abstract: absolute versus relative changes and limits for highly trained participants",
    "type": "systematic_review_bayesian_meta_analysis"
  },
  "X14": {
    "title": "Compatibility of Concurrent Aerobic and Strength Training for Skeletal Muscle Size and Function: An Updated Systematic Review and Meta-Analysis",
    "url": "https://link.springer.com/article/10.1007/s40279-021-01587-7",
    "pubmedUrl": "https://pubmed.ncbi.nlm.nih.gov/34757594/",
    "year": 2022,
    "onlineYear": 2021,
    "doi": "10.1007/s40279-021-01587-7",
    "authors": "Moritz Schumann et al.",
    "evidenceType": "systematic_review_meta_analysis",
    "readStatus": "publisher_abstract_and_selected_methods_read",
    "accessedAt": "2026-11-14",
    "population": "43 healthy adult studies; supervised concurrent training at least four weeks; identical strength-training comparator",
    "sourceSection": "Abstract; Methods 2.2",
    "type": "systematic_review_meta_analysis"
  },
  "X15": {
    "title": "The effect of abdominal exercise on abdominal fat",
    "url": "https://pubmed.ncbi.nlm.nih.gov/21804427/",
    "year": 2011,
    "doi": "10.1519/JSC.0b013e3181fb4a46",
    "authors": "Sachin S Vispute et al.",
    "evidenceType": "randomized_parallel_trial",
    "readStatus": "complete_author_abstract_read_in_PubMed_search_result",
    "accessedAt": "2026-11-14",
    "population": "24 healthy sedentary adults, 14 men/10 women, aged 18–40; six weeks of abdominal exercises versus no intervention, isocaloric diet",
    "sourceSection": "Abstract: abdominal endurance versus fat and circumference outcomes",
    "type": "randomized_parallel_trial"
  },
  "X16": {
    "title": "The effect of protein timing on muscle strength and hypertrophy: a meta-analysis",
    "url": "https://link.springer.com/article/10.1186/1550-2783-10-53",
    "year": 2013,
    "doi": "10.1186/1550-2783-10-53",
    "authors": "Brad Jon Schoenfeld, Alan Albert Aragon, James W Krieger",
    "evidenceType": "meta_analysis_meta_regression",
    "readStatus": "author_abstract_and_selected_original_results_read",
    "accessedAt": "2026-11-14",
    "population": "Strength analysis: 20 studies/478 participants; hypertrophy: 23 studies/525; different total protein intake among studies",
    "sourceSection": "Abstract; Results: full model and total-protein-adjusted analyses",
    "limitation": "Historical synthesis; not proof that timing is irrelevant in every feeding or athletic context.",
    "type": "meta_analysis_meta_regression"
  },
  "X17": {
    "title": "Differential effects of attentional focus strategies during long-term resistance training",
    "url": "https://pubmed.ncbi.nlm.nih.gov/29533715/",
    "year": 2018,
    "doi": "10.1080/17461391.2018.1447020",
    "authors": "Brad Jon Schoenfeld et al.",
    "evidenceType": "randomized_parallel_trial",
    "readStatus": "complete_author_abstract_read_in_PubMed_search_result",
    "accessedAt": "2026-11-14",
    "population": "30 untrained college-aged men; eight-week internal versus external attentional-focus training",
    "sourceSection": "Abstract: elbow-flexor versus quadriceps thickness results",
    "type": "randomized_parallel_trial"
  },
  "X18": {
    "title": "Effect of Resistance Training Frequency on Gains in Muscular Strength: A Systematic Review and Meta-Analysis",
    "url": "https://pubmed.ncbi.nlm.nih.gov/29470825/",
    "year": 2018,
    "doi": "10.1007/s40279-018-0872-x",
    "authors": "Jozo Grgic et al.",
    "evidenceType": "systematic_review_meta_analysis",
    "readStatus": "complete_author_abstract_read_through_indexed_PubMed_linkout_result",
    "accessedAt": "2026-11-14",
    "population": "22 studies, mostly untrained participants; frequency and maximal-strength outcomes",
    "sourceSection": "Abstract: volume-equated subgroup and trained-population limitation",
    "type": "systematic_review_meta_analysis"
  },
  "X19": {
    "title": "The effect of acute hydration on body composition assessed by multi-frequency and single-frequency bioelectrical impedance",
    "url": "https://pubmed.ncbi.nlm.nih.gov/37335581/",
    "year": 2023,
    "doi": "10.23736/S0022-4707.23.14913-9",
    "authors": "Soolim Jeong et al.",
    "evidenceType": "acute_before_after_measurement_experiment",
    "readStatus": "complete_author_abstract_read_in_PubMed_search_result",
    "accessedAt": "2026-11-14",
    "population": "39 participants, 20 men and 19 women; DXA and two BIA modes before/after acute water intake",
    "sourceSection": "Abstract: estimation changes and conclusion",
    "limitation": "Acute measurement experiment; not a hydration recommendation or calibration formula.",
    "type": "acute_before_after_measurement_experiment"
  }
};
export const knowledgeChunks=[
  {
    "id": "F01",
    "title": "RIR 在记录什么",
    "topics": [
      "rir"
    ],
    "sources": [
      "C"
    ],
    "text": "RIR 是完成一组后，对还能规范完成多少次的主观估计。例如 RIR2 表示估计还能做2次，RIR0 表示估计不能再完成一次规范重复。它不是已经完成的次数，也不是下一组必须完成的次数。",
    "scope": "训练感受量尺；不是精确测量。",
    "reviewStatus": "ai-organized",
    "independentReview": "not-performed",
    "unsupportedInferences": []
  },
  {
    "id": "F02",
    "title": "RIR 的估计存在误差",
    "topics": [
      "rir",
      "accuracy"
    ],
    "sources": [
      "D",
      "P"
    ],
    "text": "RIR 估计会受训练负荷等条件影响；研究中的重负荷估计更准确，不能假定所有情境同样可靠。LiftLog 不确定的 RIR 可以留空，空值不会作为零处理。",
    "scope": "研究样本为受过训练的男性；记录规则为本产品约定。",
    "reviewStatus": "ai-organized",
    "independentReview": "not-performed",
    "unsupportedInferences": []
  },
  {
    "id": "F03",
    "title": "增肌并不等于每组绝对力竭",
    "topics": [
      "failure"
    ],
    "sources": [
      "B"
    ],
    "text": "该综述没有发现瞬时肌肉力竭训练对肌肥大始终优于非力竭训练。不同研究的力竭定义和训练条件存在差异；这也不意味着训练努力程度无关紧要。",
    "scope": "研究汇总结论，不能据此给个人规定所有组的强度。",
    "reviewStatus": "ai-organized",
    "independentReview": "not-performed",
    "unsupportedInferences": []
  },
  {
    "id": "F04",
    "title": "周工作组是观察增肌训练量的一种口径",
    "topics": [
      "volume"
    ],
    "sources": [
      "A"
    ],
    "text": "ACSM 的健康成人证据摘要指出，较高的周训练量有助于肌肥大，并以每肌群每周约10组作为参考。它不是所有新手都必须立即达到的固定处方。",
    "scope": "健康成人的一般证据；应结合目标和可持续性理解。",
    "reviewStatus": "ai-organized",
    "independentReview": "not-performed",
    "unsupportedInferences": []
  },
  {
    "id": "F05",
    "title": "规律训练与频率",
    "topics": [
      "frequency",
      "consistency"
    ],
    "sources": [
      "A"
    ],
    "text": "ACSM 强调规律参与抗阻训练，并建议主要肌群每周至少训练两天。安排应适合个人目标与日程；训练频率和每周总工作组数是不同变量。",
    "scope": "一般健康成人建议；不用于个体诊疗或康复计划。",
    "reviewStatus": "ai-organized",
    "independentReview": "not-performed",
    "unsupportedInferences": []
  },
  {
    "id": "F06",
    "title": "器械不是唯一决定因素",
    "topics": [
      "equipment"
    ],
    "sources": [
      "A"
    ],
    "text": "自由重量、器械、弹力带和自重训练都可以带来益处。证据没有显示器材类型本身在所有情况下都持续决定训练结果。",
    "scope": "一般抗阻训练证据，不能将不同动作的重量直接视作等价。",
    "reviewStatus": "ai-organized",
    "independentReview": "not-performed",
    "unsupportedInferences": []
  },
  {
    "id": "F07",
    "title": "日志的公斤容量与周组数不是同一指标",
    "topics": [
      "log-volume",
      "volume"
    ],
    "sources": [
      "P",
      "A"
    ],
    "text": "LiftLog 的负重容量是已完成负重工作组的重量乘次数之和，不含热身组，自重组不计公斤容量。增肌资料中的周肌群工作组数采用另一种口径，不能把两者直接互换。",
    "scope": "前半为产品计算约定；不代表肌肉增长量。",
    "reviewStatus": "ai-organized",
    "independentReview": "not-performed",
    "unsupportedInferences": []
  },
  {
    "id": "F08",
    "title": "组间休息并非越短越好",
    "topics": [
      "rest"
    ],
    "sources": [
      "E"
    ],
    "text": "该综述提示，超过60秒的组间休息可能有小幅肌肥大收益；超过90秒后未观察到明确差异，但估计区间重叠且研究有异质性。不能据此认定90秒最优，或更长休息没有价值。",
    "scope": "健康成人研究汇总，不等于个人训练处方。",
    "reviewStatus": "ai-organized",
    "independentReview": "not-performed",
    "unsupportedInferences": []
  },
  {
    "id": "F09",
    "title": "蛋白粉是一种补充形式",
    "topics": [
      "protein"
    ],
    "sources": [
      "F"
    ],
    "text": "蛋白质与训练适应有关，补充剂可用于补足饮食需要，但不能代替抗阻训练和整体饮食。是否需要蛋白粉应结合已有饮食，资料不能直接确定个人摄入克数。",
    "scope": "一般运动营养资料；不提供个人营养或疾病方案。",
    "reviewStatus": "ai-organized",
    "independentReview": "not-performed",
    "unsupportedInferences": []
  },
  {
    "id": "F10",
    "title": "肌酸的证据范围",
    "topics": [
      "creatine"
    ],
    "sources": [
      "F"
    ],
    "text": "肌酸的较充分证据集中在短时、重复高强度运动表现，个体反应可能不同。不能把使用补充剂直接等同于一定增加多少肌肉，也不据此给个人指定用量。",
    "scope": "本库不覆盖肾病、孕期或用药相关问题。",
    "reviewStatus": "ai-organized",
    "independentReview": "not-performed",
    "unsupportedInferences": []
  },
  {
    "id": "F11",
    "title": "延迟性酸痛与乳酸不是同一回事",
    "topics": [
      "soreness"
    ],
    "sources": [
      "G"
    ],
    "text": "不熟悉的负荷可能引起延迟性肌肉酸痛，通常在运动后逐渐出现。ACSM 的说明指出，这种延迟性酸痛不是由乳酸积累造成的。",
    "scope": "一般知识；持续、急性或异常疼痛不在本问答范围。",
    "reviewStatus": "ai-organized",
    "independentReview": "not-performed",
    "unsupportedInferences": []
  },
  {
    "id": "F12",
    "title": "外形目标不作为身体测量",
    "topics": [
      "appearance"
    ],
    "sources": [
      "V"
    ],
    "text": "在 LiftLog 中，薄肌、脂包肌、宽肩窄腰作为用户的外形目标语境，不自动换算为体脂率、肌肉量或训练处方。实际测量和完成的训练应分别记录。",
    "scope": "产品词表约定；不是医学分类。",
    "reviewStatus": "ai-organized",
    "independentReview": "not-performed",
    "unsupportedInferences": []
  },
  {
    "id": "F13",
    "title": "增肌没有唯一的次数区间",
    "text": "负荷综述中，较轻与较重负荷训练都能增加肌肉尺寸，平均增肌差异并不明确。不能把某个次数区间当成唯一有效区间，也不能忽略研究中的努力程度和训练安排。",
    "scope": "研究负荷比较；不把任意轻松活动视为同等刺激。",
    "unsupportedInferences": [
      "所有重量随便练效果相同",
      "直接生成个人次数处方"
    ],
    "topics": [
      "load",
      "repetitions",
      "hypertrophy"
    ],
    "sources": [
      "H"
    ],
    "evidenceType": "systematic_review_meta_analysis",
    "sourceSection": "Abstract: results and conclusion",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F14",
    "title": "力量进步与肌肉增长分别看",
    "text": "在负荷比较研究中，较重负荷对最大力量测试通常更有优势，肌肉尺寸的结果却不一定相同。因此，举得更重是力量表现的进步，不能直接换算成已经长了多少肌肉。",
    "scope": "最大力量与肌肥大为不同研究结局；最后一句为保守的产品解释边界。",
    "unsupportedInferences": [
      "力量和肌肉增长完全无关",
      "从训练公斤数计算肌肉公斤数"
    ],
    "topics": [
      "load",
      "strength",
      "progress"
    ],
    "sources": [
      "H"
    ],
    "evidenceType": "systematic_review_meta_analysis",
    "sourceSection": "Abstract: maximal-strength versus hypertrophy findings",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F15",
    "title": "完整行程的证据有具体范围",
    "text": "一项汇总十六项研究的分析发现，完整行程对力量和下肢肌肥大平均更有利。这并不证明所有局部行程都无效，也不能据此要求有疼痛或活动受限的人强行加深动作。",
    "scope": "健康成人、截至2021年的研究；肌肥大优势主要涉及下肢。",
    "unsupportedInferences": [
      "所有肌群完整行程必然胜出",
      "疼痛时必须强行拉到极限"
    ],
    "topics": [
      "rom",
      "technique"
    ],
    "sources": [
      "I"
    ],
    "evidenceType": "systematic_review_meta_analysis",
    "sourceSection": "Abstract; Methods 2.2; Discussion 4.3",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F16",
    "title": "局部行程还要看训练在哪一段",
    "text": "局部行程不是单一做法。相关综述提示，在较长肌肉长度位置训练，部分肌肉或区域可能获得较好增长。结果受动作、肌群和测量位置影响，不能概括为半程永远优于全程。",
    "scope": "十一项研究的系统综述；并非对所有动作和所有身体区域的结论。",
    "unsupportedInferences": [
      "任何半程都更增肌",
      "统一替换所有完整行程动作"
    ],
    "topics": [
      "rom",
      "muscle-length",
      "exercise-selection"
    ],
    "sources": [
      "J"
    ],
    "evidenceType": "systematic_review",
    "sourceSection": "Abstract: regional findings and conclusion",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F17",
    "title": "力量训练也可以改善活动范围",
    "text": "健康人群的研究汇总发现，使用外部负荷的抗阻训练也能改善关节活动范围，与拉伸训练的平均差异不明确。这是柔韧性方面的结果，不代表拉伸毫无用途或能够治疗关节问题。",
    "scope": "健康参与者、长期训练的活动范围结局；不是急性热身或康复结论。",
    "unsupportedInferences": [
      "任何拉伸都不需要",
      "抗阻训练可自行治疗关节病"
    ],
    "topics": [
      "rom",
      "flexibility"
    ],
    "sources": [
      "K"
    ],
    "evidenceType": "systematic_review_meta_analysis",
    "sourceSection": "Abstract: eligibility, results and conclusion",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F18",
    "title": "分化和全身训练都可以有效",
    "text": "十四项研究的汇总显示，在训练量相等时，分化训练与全身训练的力量和增肌结果没有明确差异。计划名称本身不决定效果，选择时可以考虑日程、偏好和能否持续完成。",
    "scope": "健康成人、训练量相等的比较；坚持因素为作者讨论的选择依据。",
    "unsupportedInferences": [
      "任意分化都与任意全身方案等效",
      "训练量不必比较"
    ],
    "topics": [
      "split",
      "frequency",
      "adherence"
    ],
    "sources": [
      "L"
    ],
    "evidenceType": "systematic_review_meta_analysis",
    "sourceSection": "Abstract: sample, volume-equated conclusion",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F19",
    "title": "多加工作组不保证多长肌肉",
    "text": "在年轻且有训练经验男性的研究汇总中，中等与更高周训练量的股四头肌和肱二头肌增长差异不明确。这不能证明额外组数永远无效，也不支持仅因变化慢就不断叠加组数。",
    "scope": "有限样本、特定肌群和训练量分组；不能作为新手组数起点。",
    "unsupportedInferences": [
      "某个周组数是所有人的上限",
      "新手必须照搬研究组数"
    ],
    "topics": [
      "volume",
      "plateau",
      "hypertrophy"
    ],
    "sources": [
      "M"
    ],
    "evidenceType": "systematic_review_meta_analysis",
    "sourceSection": "Abstract; quadriceps and biceps quantitative results",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F20",
    "title": "动作变化应有明确目的",
    "text": "动作变化的综述提示，有计划地调整动作，可能影响局部肌肉增长和力量适应。重点是动作提供了什么不同刺激，而不是单纯增加动作数量；结论主要来自年轻男性研究。",
    "scope": "八项研究、二百四十一名年轻男性；综述没有给出通用动作清单。",
    "unsupportedInferences": [
      "动作越多一定越好",
      "某个动作组合对所有人最优"
    ],
    "topics": [
      "exercise-selection",
      "variation"
    ],
    "sources": [
      "N"
    ],
    "evidenceType": "systematic_review",
    "sourceSection": "Abstract: sample and systematic-variation conclusion",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F21",
    "title": "每天随机换动作未必更先进",
    "text": "研究综述提醒，过度、随机地更换动作，或堆叠刺激重复的动作，可能不利于训练适应。追求新鲜感不能直接等同于效果提升；这也不意味着计划中的动作永远不能调整。",
    "scope": "综述的谨慎结论；不指定必须固定几周或某种换动作周期。",
    "unsupportedInferences": [
      "任何换动作都会损失肌肉",
      "存在统一换动作时间表"
    ],
    "topics": [
      "exercise-selection",
      "variation",
      "consistency"
    ],
    "sources": [
      "N"
    ],
    "evidenceType": "systematic_review",
    "sourceSection": "Abstract: excessive/random variation limitation",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F22",
    "title": "蛋白补充的效果要结合训练理解",
    "text": "健康成人试验的汇总发现，在持续抗阻训练期间，蛋白补充对力量和肌肉相关指标有平均额外收益。它描述的是群体结果，不能保证每个人获得同样变化，也不能替代实际训练。",
    "scope": "至少六周抗阻训练加蛋白补充的试验；已读取2020年利益冲突更正。",
    "unsupportedInferences": [
      "喝蛋白粉即可增肌",
      "群体平均变化就是个人承诺"
    ],
    "topics": [
      "protein",
      "nutrition",
      "hypertrophy"
    ],
    "sources": [
      "O"
    ],
    "evidenceType": "systematic_review_meta_analysis_meta_regression",
    "sourceSection": "Abstract: eligibility and results; 2020 correction",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F23",
    "title": "蛋白研究中的人群差异不能抹平",
    "text": "蛋白补充综述发现，年龄与训练经历会影响部分平均结果。不能把一种研究人群的收益直接套给所有新手，也不能仅凭年龄、体重或外形目标，就推算个人该吃多少蛋白质。",
    "scope": "研究层面的调节分析，不能预测某一个人的反应。",
    "unsupportedInferences": [
      "年龄较大就没有收益",
      "仅凭人口信息计算个人营养处方"
    ],
    "topics": [
      "protein",
      "individual-differences",
      "nutrition"
    ],
    "sources": [
      "O"
    ],
    "evidenceType": "systematic_review_meta_regression",
    "sourceSection": "Abstract: age and training-status moderators",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F24",
    "title": "增肌饮食不只看蛋白质",
    "text": "运动营养资料强调，充足的能量、水分、碳水化合物、脂肪和微量营养素同样属于饮食基础。碳水参与运动供能和肌糖原补充，不能把只增加蛋白质当成完整的增肌饮食。",
    "scope": "一般营养教育；不生成热量盈余或个体营养素目标。",
    "unsupportedInferences": [
      "碳水越多越好",
      "所有人应采用同一饮食比例"
    ],
    "topics": [
      "nutrition",
      "carbohydrate",
      "fat",
      "energy"
    ],
    "sources": [
      "F"
    ],
    "evidenceType": "official_evidence_fact_sheet",
    "sourceSection": "Introduction: dietary foundation",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F25",
    "title": "开始补肌酸后的体重变化要分清",
    "text": "肌酸补充可能伴随体内水分增加和体重上升，因此体重变化不能全部解释成新增肌肉。记录补充剂使用有助于理解趋势，但单凭体重秤无法判断这次变化中肌肉与水分各有多少。",
    "scope": "NIH资料的水分相关体重变化；后半为测量解释边界。",
    "unsupportedInferences": [
      "肌酸增重全部是水",
      "可以按固定比例扣除体重变化"
    ],
    "topics": [
      "creatine",
      "body-weight",
      "progress"
    ],
    "sources": [
      "F"
    ],
    "evidenceType": "official_evidence_fact_sheet",
    "sourceSection": "Creatine: Safety",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F26",
    "title": "复合补剂不能借用单一成分结论",
    "text": "一款复合补剂包含某种有研究的成分，不代表整个配方已有同样证据。NIH资料指出，成分组合与含量不同，不能仅凭单一成分试验推断整款产品的效果和安全性。",
    "scope": "补充剂证据解读；不替具体品牌背书或判断个人适用性。",
    "unsupportedInferences": [
      "所有复合补剂都无效",
      "单一成分安全就证明任何配方安全"
    ],
    "topics": [
      "supplement",
      "evidence-literacy",
      "nutrition"
    ],
    "sources": [
      "F"
    ],
    "evidenceType": "official_evidence_fact_sheet",
    "sourceSection": "Selected Ingredients: combination-product limitations",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F27",
    "title": "酸痛强度不是肌肉损伤计量器",
    "text": "一项离心运动实验发现，酸痛程度与其他肌肉损伤指标的相关性较弱。因此，感觉越酸不能直接解释为肌肉受损越多，更不能进一步当作这次一定长了更多肌肉的证明。",
    "scope": "男性学生的肘屈肌最大离心实验；最后一句为不作过度推断的边界。",
    "unsupportedInferences": [
      "没有酸痛就绝对没有损伤",
      "可忽略急性或异常疼痛"
    ],
    "topics": [
      "soreness",
      "recovery",
      "progress"
    ],
    "sources": [
      "Q"
    ],
    "evidenceType": "controlled_experimental_study",
    "sourceSection": "Abstract: methods, correlations and conclusion",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F28",
    "title": "酸痛的时间变化并不完全一致",
    "text": "不同运动情境的原始试验资料显示，长跑后的酸痛变化与未训练者踏阶运动后的曲线不同。常见的延迟酸痛时间描述只是一般现象，不能当作判断每个人是否恢复的固定倒计时。",
    "scope": "不同人群和运动的资料再分析；无法单独区分训练经历与运动形式的作用。",
    "unsupportedInferences": [
      "能仅按小时数证明完全恢复",
      "把长跑结果直接套给所有抗阻训练"
    ],
    "topics": [
      "soreness",
      "recovery",
      "individual-differences"
    ],
    "sources": [
      "R"
    ],
    "evidenceType": "secondary_analysis_of_original_trial_data",
    "sourceSection": "Abstract: population, time-course comparison and conclusion",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F29",
    "title": "多一天训练不自动代表更多增长",
    "text": "一项十周训练实验中，在周训练量相等的条件下，同一肌群每周练两天与三天的主要适应差异不明确。这提示比较频率时要同时看总量，不能只用打卡天数判断训练更有效。",
    "scope": "有训练经验男性的小型试验；不能证明所有频率、所有人群完全等效。",
    "unsupportedInferences": [
      "训练频率永远不重要",
      "不同总量计划可以只比天数"
    ],
    "topics": [
      "frequency",
      "volume",
      "progress"
    ],
    "sources": [
      "S"
    ],
    "evidenceType": "randomized_parallel_trial",
    "sourceSection": "Abstract; Methods: volume-equated training groups",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F30",
    "title": "不必等到找到完美计划才开始",
    "text": "健康成人的网络荟萃分析发现，所比较的多种抗阻训练安排，相对于不训练都改善了力量和肌肉相关结果。研究中的方案排名不是个人最优答案，也不是所有安排都毫无差别。",
    "scope": "研究比较的十二种负荷、组数和频率组合；不覆盖任意自创方案。",
    "unsupportedInferences": [
      "任何计划都有效且安全",
      "排名第一应推荐给所有用户"
    ],
    "topics": [
      "programming",
      "adherence",
      "evidence-literacy"
    ],
    "sources": [
      "T"
    ],
    "evidenceType": "systematic_review_bayesian_network_meta_analysis",
    "sourceSection": "Abstract: eligibility, comparative results and ranking",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F31",
    "title": "力竭还伴随当次疲劳成本",
    "text": "急性研究的汇总发现，练到力竭通常比未力竭带来更明显的即时疲劳和运动表现下降。比较训练方式时，除了是否完成更多重复，也需要区分刺激目标与当次疲劳表现。",
    "scope": "交叉试验的急性结局；不是长期增肌或个人恢复时间处方。",
    "unsupportedInferences": [
      "力竭一定有害",
      "据此认定力竭长期增肌一定更差"
    ],
    "topics": [
      "failure",
      "fatigue",
      "recovery"
    ],
    "sources": [
      "U"
    ],
    "evidenceType": "systematic_review_meta_analysis",
    "sourceSection": "Abstract: acute biomechanical results and conclusion",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F32",
    "title": "练得很累不等于长期一定更有效",
    "text": "急性疲劳研究测量的是运动后短时间内的表现、代谢或感受，并不直接测量数周后的肌肉增长。因此，练完更累、当次指标更高，都不能单独作为长期增肌方案优劣的结论。",
    "scope": "根据研究设计划定证据边界，不声称疲劳与适应毫无关系。",
    "unsupportedInferences": [
      "疲劳完全不影响适应",
      "用单次乳酸或疲劳感预测增肌量"
    ],
    "topics": [
      "fatigue",
      "progress",
      "evidence-literacy"
    ],
    "sources": [
      "U"
    ],
    "evidenceType": "study_design_boundary",
    "sourceSection": "Abstract: selected acute outcomes and longitudinal limitation",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F33",
    "title": "进步不只有加重量这一种形式",
    "text": "一项有训练经验成人的下肢实验发现，在八周周期内，逐步加重量与逐步加重复次数都可带来肌肉适应。没有每次加片不等于没有进步，但不能把次数增加直接换算成肌肉增长量。",
    "scope": "特定监督训练方案、成年训练者；不能承诺所有进阶方式永久等效。",
    "unsupportedInferences": [
      "每次都必须加次数",
      "无限增加重复次数一定持续增肌"
    ],
    "topics": [
      "progress",
      "progressive-overload",
      "repetitions"
    ],
    "sources": [
      "W"
    ],
    "evidenceType": "randomized_parallel_trial",
    "sourceSection": "Abstract; Methods: training progression",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F34",
    "title": "比较肌肉尺寸要注意测量条件",
    "text": "肌肉适应实验会统一测量位置，并安排训练后的休息间隔，以减少肿胀对肌厚结果的干扰。日常观察也应留意测量条件；刚练完的外观变化不能直接当成已经稳定增长的证据。",
    "scope": "原始试验的测量流程加保守产品解释；不提供家庭测量误差或通用等待时限。",
    "unsupportedInferences": [
      "休息固定小时后任何测量都精确",
      "凭照片精确估算新增肌肉"
    ],
    "topics": [
      "progress",
      "measurement",
      "hypertrophy"
    ],
    "sources": [
      "W"
    ],
    "evidenceType": "original_trial_measurement_method",
    "sourceSection": "Methods: Muscle thickness; standardized locations and delayed measurements",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F35",
    "title": "日志没有记录的背景仍然未知",
    "topics": [
      "logging",
      "recovery",
      "evidence-literacy"
    ],
    "sources": [
      "P"
    ],
    "text": "LiftLog 的训练日志记录已完成动作、工作组和填写的感受。没有填写的睡眠、饮食、伤病或身体恢复状态仍然未知，不能仅凭容量、出勤或 RIR 的变化替用户补全这些信息。",
    "scope": "产品数据边界，不是关于恢复能力的医学判断。",
    "unsupportedInferences": [
      "根据日志诊断恢复差",
      "自动推断用户睡眠或饮食"
    ],
    "reviewStatus": "ai-organized",
    "independentReview": "not-performed"
  },
  {
    "id": "F36",
    "title": "比较记录先对齐条件",
    "topics": [
      "comparison",
      "equipment",
      "progress"
    ],
    "sources": [
      "P"
    ],
    "text": "LiftLog 比较同一动作时，需要对齐器械设置、动作顺序与已记录的 RIR，再观察同重量次数或同次数重量的变化。不同器械的标重、未知余力或变化的设置，不能直接当成同条件力量进步。",
    "scope": "产品比较口径；记录上的表现变化不等于肌肉增长量。",
    "unsupportedInferences": [
      "不同器械配重直接等价",
      "缺失条件视作完全一致"
    ],
    "reviewStatus": "ai-organized",
    "independentReview": "not-performed"
  },
  {
    "id": "F37",
    "title": "动作数、组数和肌群分类分开看",
    "topics": [
      "logging",
      "volume",
      "muscle-overlap"
    ],
    "sources": [
      "P"
    ],
    "text": "LiftLog 按动作主要部位归类已完成工作组，不把动作数量直接当成工作组数量，也不将每个辅助肌群重复算作一个完整工作组。这是便于回看日志的统计约定，不是对每块肌肉刺激量的精确测量。",
    "scope": "产品分类规范，不能等同于研究中的逐肌群有效训练量。",
    "unsupportedInferences": [
      "自动精确折算所有辅助肌群训练量"
    ],
    "reviewStatus": "ai-organized",
    "independentReview": "not-performed"
  },
  {
    "id": "F38",
    "title": "刻意放慢不自动增加增肌效果",
    "text": "十四项研究的节奏汇总中，较快与较慢重复的平均肌肥大差异很小，估计仍有不确定性。不能仅因动作耗时更长，就认定肌肉一定长得更多；结论也不支持失控地甩动重量。",
    "scope": "研究比较的节奏范围及健康成人；不延伸到任意极端慢速或失控动作。",
    "unsupportedInferences": [
      "越快越好",
      "慢速动作完全没有用途"
    ],
    "topics": [
      "tempo",
      "time-under-tension",
      "hypertrophy"
    ],
    "sources": [
      "X01"
    ],
    "evidenceType": "systematic_review_bayesian_meta_analysis",
    "sourceSection": "Abstract: pairwise differences and conclusion",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F39",
    "title": "节奏需要分清动作的不同阶段",
    "text": "节奏研究会区分举起重量的向心阶段与放下重量的离心阶段。只写慢速或快一些，无法说明到底改了哪一段；比较训练记录时，应保留这种差别，不把整组耗时直接当成增肌量。",
    "scope": "研究变量定义及记录解释，不提供每阶段的个人秒数处方。",
    "unsupportedInferences": [
      "整组秒数可计算新增肌肉",
      "只改变离心与只改变向心完全相同"
    ],
    "topics": [
      "tempo",
      "concentric",
      "eccentric",
      "logging"
    ],
    "sources": [
      "X01"
    ],
    "evidenceType": "study_variable_definition",
    "sourceSection": "Abstract: eccentric/concentric intervention coding",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F40",
    "title": "想优先提高哪个动作可以影响顺序",
    "text": "动作顺序综述发现，放在训练前面的动作通常获得更大的对应力量提升。优先顺序可以服务具体力量目标，不能因此机械规定所有人都必须先练大肌群，或永远先做复合动作。",
    "scope": "纵向研究的动作特定力量结果；不覆盖每种训练目标。",
    "unsupportedInferences": [
      "第一个动作能获得所有方面最大收益",
      "所有孤立动作必须最后做"
    ],
    "topics": [
      "exercise-order",
      "strength",
      "programming"
    ],
    "sources": [
      "X02"
    ],
    "evidenceType": "systematic_review_meta_analysis",
    "sourceSection": "Abstract: single-joint and multi-joint strength comparisons",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F41",
    "title": "预先练累不代表一定更增肌",
    "text": "比较多关节与单关节动作先后顺序的研究汇总，没有发现清楚的平均肌肥大优势。因此，先做孤立动作把肌肉练累，不能直接宣传成必然更增肌；力量目标和可完成训练仍需分别考虑。",
    "scope": "现有动作顺序研究，不能据未显著差异认定所有顺序绝对等效。",
    "unsupportedInferences": [
      "预疲劳必然更增肌",
      "任何顺序对表现都没有影响"
    ],
    "topics": [
      "exercise-order",
      "pre-exhaustion",
      "hypertrophy"
    ],
    "sources": [
      "X02"
    ],
    "evidenceType": "systematic_review_meta_analysis",
    "sourceSection": "Abstract: hypertrophy comparison and conclusion",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F42",
    "title": "长期吃不够可能限制增肌适应",
    "text": "能量缺口研究的汇总发现，长期能量不足会削弱抗阻训练后的瘦体重增长，而力量提升的差异未必同样明显。瘦体重与力量是不同指标，不能因重量还能增加就忽略整体饮食不足。",
    "scope": "至少三周的研究；瘦体重不是直接测得的纯肌肉，不设个人热量阈值。",
    "unsupportedInferences": [
      "任何减重都绝不可能增肌",
      "套用研究回归阈值给个人开热量处方"
    ],
    "topics": [
      "energy",
      "nutrition",
      "lean-mass",
      "strength"
    ],
    "sources": [
      "X03"
    ],
    "evidenceType": "systematic_review_meta_analysis_meta_regression",
    "sourceSection": "Abstract: energy-deficit versus control results",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F43",
    "title": "增重更快不等于肌肉长得更快",
    "text": "一项训练者的小型实验中，体重增长更快主要与皮褶厚度增加相关，肌厚和力量并未普遍同步获益。瘦人增肌也不能把体重快速上涨当作唯一目标，更不能把全部增重都算成肌肉。",
    "scope": "八周、十七名完成人的小型试验；不是通用增重速度上限。",
    "unsupportedInferences": [
      "多吃永远没有帮助",
      "任意增重速度都可按固定比例拆成肌肉和脂肪"
    ],
    "topics": [
      "energy-surplus",
      "body-weight",
      "hypertrophy"
    ],
    "sources": [
      "X06"
    ],
    "evidenceType": "randomized_parallel_trial",
    "sourceSection": "Abstract: regression, conclusion and limitations",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F44",
    "title": "正常进食后再补碳水未必额外增力",
    "text": "碳水研究汇总中，已经进食且训练量不高的条件下，额外增加碳水通常没有带来明确的力量训练表现收益。这不等于碳水没有作用，也不能据此认定所有人都应该减少碳水。",
    "scope": "研究中的进食状态与常规训练量；表现结果不是直接肌肉增长量。",
    "unsupportedInferences": [
      "碳水不参与供能",
      "低碳饮食对所有人更优"
    ],
    "topics": [
      "carbohydrate",
      "nutrition",
      "performance"
    ],
    "sources": [
      "X04"
    ],
    "evidenceType": "systematic_review",
    "sourceSection": "Abstract: fed-state studies and conclusion",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F45",
    "title": "补碳水的效果取决于训练情境",
    "text": "同一碳水综述中，观察到表现收益的研究较常涉及空腹对照或较高训练量。回答训练前要不要补充时，应先区分进食和训练条件，而不是把一种场景的结论套给所有健身者。",
    "scope": "条件性、异质性研究发现；不指定进食时间、克数或训练量个人阈值。",
    "unsupportedInferences": [
      "空腹一定练不好",
      "加碳水必定增加肌肉"
    ],
    "topics": [
      "carbohydrate",
      "fasted",
      "training-volume"
    ],
    "sources": [
      "X04"
    ],
    "evidenceType": "systematic_review",
    "sourceSection": "Abstract: acute study conditions and need for matched controls",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F46",
    "title": "体脂秤的体重与体成分可靠性不同",
    "text": "三款家用智能秤与身体成分扫描比较的研究中，体重误差相对较小，但脂肪和瘦体重估计存在明显偏差。体重读数接近，不代表屏幕上的体脂率或肌肉量也具有同样的准确性。",
    "scope": "特定旧款设备与医院成人样本，不代表所有型号当前的固定误差。",
    "unsupportedInferences": [
      "所有智能秤一律不准",
      "某品牌任何型号都可套用同一个校正值"
    ],
    "topics": [
      "body-fat",
      "smart-scale",
      "measurement"
    ],
    "sources": [
      "X05"
    ],
    "evidenceType": "cross_sectional_device_validation",
    "sourceSection": "Abstract: weight versus composition error",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F47",
    "title": "体脂秤的肌肉量属于算法估计",
    "text": "常见脚底电极智能秤会结合阻抗、身高、体重、年龄等信息估计身体成分，并不是直接称出身体里的肌肉。估计依赖公式与人群数据，因此不能把显示的小数精度当成真实测量精度。",
    "scope": "研究描述的脚到脚阻抗设备原理；不是对所有测量技术的统一结论。",
    "unsupportedInferences": [
      "小数位多就更准确",
      "阻抗值就是肌肉重量"
    ],
    "topics": [
      "body-fat",
      "bia",
      "measurement",
      "uncertainty"
    ],
    "sources": [
      "X05"
    ],
    "evidenceType": "device_estimation_method",
    "sourceSection": "Introduction: foot-to-foot impedance and prediction model",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F48",
    "title": "刚喝水后体脂读数也可能改变",
    "text": "一项急性测量实验发现，饮水后某些阻抗设备会把增加的质量部分归为脂肪，体脂率读数随之变化。短时间读数跳动不等于真正迅速长脂肪，比较趋势时需要注意测量条件。",
    "scope": "特定设备与一次饮水实验；不建议模仿实验饮水量，也不提供校准公式。",
    "unsupportedInferences": [
      "所有设备喝水后变化方向相同",
      "可用固定差值扣除水分"
    ],
    "topics": [
      "bia",
      "hydration",
      "body-fat",
      "measurement"
    ],
    "sources": [
      "X19"
    ],
    "evidenceType": "acute_before_after_measurement_experiment",
    "sourceSection": "Abstract: measured fat percentage and classification changes",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F49",
    "title": "侧平举不必只认一种器械",
    "text": "在动作行程匹配的八周实验中，有训练经验者使用哑铃或绳索侧平举，三角肌中束肌厚都增加，差异支持相近效果。不能只因绳索阻力感觉不同，就断言它对所有人一定更增肌。",
    "scope": "二十四名训练者、特定行程与方案；不能推广为所有器械和动作完全等价。",
    "unsupportedInferences": [
      "器械选择从来不重要",
      "所有肩部动作都能互相替换"
    ],
    "topics": [
      "shoulder",
      "deltoid",
      "lateral-raise",
      "equipment"
    ],
    "sources": [
      "X09"
    ],
    "evidenceType": "randomized_within_person_trial",
    "sourceSection": "Abstract: matched range and Bayesian comparison",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F50",
    "title": "卧推角度的结果可能因胸部区域而异",
    "text": "未训练年轻男性的实验中，上斜、平板及组合卧推在一般力量变化上相近，但胸肌某个测量位置的增长不同。一个区域有差异，不能直接解释成整个胸肌都更大或某个角度全面更好。",
    "scope": "八周、每周一次、三处肌厚测量；不能据此给所有人规定卧推角度。",
    "unsupportedInferences": [
      "上斜对整个胸肌必然更优",
      "单个测量点代表整个肌肉体积"
    ],
    "topics": [
      "chest",
      "bench-press",
      "regional-hypertrophy"
    ],
    "sources": [
      "X08"
    ],
    "evidenceType": "randomized_parallel_trial",
    "sourceSection": "Abstract: site-specific thickness versus strength",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F51",
    "title": "腿弯举姿势会改变部分腘绳肌适应",
    "text": "健康成人的十二周实验中，坐姿腿弯举对部分跨髋又跨膝的腘绳肌增长更有利，俯卧姿势也有增长。不能把这个结果简化成所有长肌长动作都必胜，或认为另一种姿势完全没用。",
    "scope": "二十名成人的单腿对照、特定动作；肌肉之间的结果并不一致。",
    "unsupportedInferences": [
      "坐姿对每一块腘绳肌都更优",
      "此结果证明预防运动拉伤"
    ],
    "topics": [
      "hamstrings",
      "leg-curl",
      "muscle-length",
      "legs"
    ],
    "sources": [
      "X07"
    ],
    "evidenceType": "within_person_training_experiment",
    "sourceSection": "Abstract: Part 1 muscle-specific volume findings",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F52",
    "title": "练深蹲不等于腿部所有肌肉都充分增长",
    "text": "一项深蹲实验中，膝伸肌、臀大肌和内收肌出现不同程度的增长，而腘绳肌和股直肌没有同样变化。动作属于腿部训练，不代表腿部每一块肌肉获得了相同的增长效果。",
    "scope": "十七名男性、十周、特定深蹲方案；未显著增长不等于完全没有参与。",
    "unsupportedInferences": [
      "深蹲完全不用腘绳肌",
      "一种腿部动作足以证明所有肌群均衡增长"
    ],
    "topics": [
      "squat",
      "legs",
      "muscle-coverage",
      "exercise-selection"
    ],
    "sources": [
      "X11"
    ],
    "evidenceType": "randomized_parallel_trial",
    "sourceSection": "Abstract: MRI muscle-volume results",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F53",
    "title": "下拉握得越宽不代表背部刺激必然越大",
    "text": "一项正握下拉实验比较三种握距时，背阔肌等肌肉的整体激活大体相近。它没有支持握得越宽就必然越好的简单说法，也没有直接检验这些握距长期会让背部各长多少肌肉。",
    "scope": "十五名男性的急性负荷与肌电实验；不同动作、疼痛或康复不在研究范围。",
    "unsupportedInferences": [
      "任何握距都安全且完全相同",
      "宽握必然长宽、窄握必然长厚"
    ],
    "topics": [
      "back",
      "latissimus",
      "grip-width",
      "pulldown"
    ],
    "sources": [
      "X10"
    ],
    "evidenceType": "acute_randomized_counterbalanced_experiment",
    "sourceSection": "Abstract: similar muscle activation and design",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F54",
    "title": "肌电激活不是长期增肌排行榜",
    "text": "肌电实验观察的是特定动作条件下的电活动，不等于直接观察数周后的肌肉增长。即使某动作一次测试的激活数值更高，也不能只凭这一个指标认定它是长期增肌最好的动作。",
    "scope": "根据急性下拉实验的设计划定推断边界，不宣称肌电与训练适应毫无联系。",
    "unsupportedInferences": [
      "肌电研究完全没有价值",
      "单次肌电差异可换算未来增长百分比"
    ],
    "topics": [
      "emg",
      "evidence-literacy",
      "exercise-selection"
    ],
    "sources": [
      "X10"
    ],
    "evidenceType": "study_design_boundary",
    "sourceSection": "Abstract: acute six-repetition-maximum and EMG outcomes; no longitudinal size measure",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F55",
    "title": "相对增肌与绝对增加量要分开比较",
    "text": "男女参加相同训练的研究汇总中，男性的绝对肌肉尺寸增加略占优势，但相对起点的增幅接近。不能只看增加多少毫米，就认定女性没有相近的增肌潜力；个人反应仍会不同。",
    "scope": "健康十八至四十五岁成人研究，不等于每个人或高水平运动员都相同。",
    "unsupportedInferences": [
      "所有男女个人增长幅度相同",
      "可用性别直接预测一个人的增肌速度"
    ],
    "topics": [
      "sex-differences",
      "baseline",
      "relative-change",
      "hypertrophy"
    ],
    "sources": [
      "X13"
    ],
    "evidenceType": "systematic_review_bayesian_meta_analysis",
    "sourceSection": "Abstract: absolute and relative growth results",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F56",
    "title": "做有氧不自动抵消增肌训练",
    "text": "有氧与抗阻并练的研究汇总中，相对于相同抗阻计划单独进行，平均肌肥大和最大力量没有明显受损。不能简单说有氧一定掉肌肉，但也不能外推任意有氧量与任何恢复条件。",
    "scope": "健康成人、至少四周的监督训练；不代表能量不足或极端负荷也无影响。",
    "unsupportedInferences": [
      "有氧量可以无限增加",
      "所有训练目标与个体条件都不会受干扰"
    ],
    "topics": [
      "cardio",
      "concurrent-training",
      "hypertrophy"
    ],
    "sources": [
      "X14"
    ],
    "evidenceType": "systematic_review_meta_analysis",
    "sourceSection": "Abstract; Methods 2.2: matched strength prescription",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F57",
    "title": "并练对爆发力的影响可与增肌不同",
    "text": "同一并练综述发现，爆发力收益可能被削弱，尤其在有氧与力量安排于同一训练中时。这说明增肌、最大力量与爆发力是不同目标，不能用一个结果替代另外两个目标的判断。",
    "scope": "研究平均与亚组结果；不据此指定个人训练间隔或赛事安排。",
    "unsupportedInferences": [
      "同次训练一定损失爆发力",
      "没有增肌干扰就等于所有表现均无干扰"
    ],
    "topics": [
      "power",
      "concurrent-training",
      "training-goals"
    ],
    "sources": [
      "X14"
    ],
    "evidenceType": "systematic_review_meta_analysis",
    "sourceSection": "Abstract: explosive-strength and same-session subgroup findings",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F58",
    "title": "发力感研究的效果不一定覆盖所有肌群",
    "text": "一项新手实验发现，关注目标肌收缩的提示对肘屈肌厚度更有利，但股四头肌没有同样的差异。发力感可以作为训练体验记录，不能把没有明显感觉直接判成这组完全无效。",
    "scope": "三十名未训练大学年龄男性、八周；体验判断后半为产品解释边界。",
    "unsupportedInferences": [
      "必须有泵感才会增肌",
      "内在注意对所有动作和目标都更优"
    ],
    "topics": [
      "mind-muscle-connection",
      "cueing",
      "training-feel"
    ],
    "sources": [
      "X17"
    ],
    "evidenceType": "randomized_parallel_trial",
    "sourceSection": "Abstract: elbow-flexor and quadriceps outcomes",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F59",
    "title": "练腹部耐力不等于定点减腹部脂肪",
    "text": "一项保持等热量饮食的六周实验中，腹部训练提高了卷腹耐力，却没有明显减少腹部脂肪或腰围。练哪块肌肉与减少哪处脂肪是不同问题，不能给动作贴上定点减脂保证。",
    "scope": "二十四名久坐成人的特定方案；不是所有减脂方式的综合比较。",
    "unsupportedInferences": [
      "练腹部没有任何价值",
      "该单一试验证明一切局部脂肪变化永不发生"
    ],
    "topics": [
      "abs",
      "spot-reduction",
      "appearance",
      "endurance"
    ],
    "sources": [
      "X15"
    ],
    "evidenceType": "randomized_parallel_trial",
    "sourceSection": "Abstract: body composition and muscular-endurance results",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F60",
    "title": "错过练后几分钟不等于训练白费",
    "text": "一项蛋白时机荟萃分析在控制蛋白总量等因素后，没有发现明确的力量或增肌额外优势。不能把训练后立刻喝蛋白粉宣传成必需条件，也不能据此认为任何进食时机都毫无意义。",
    "scope": "二〇一三年研究汇总；训练前进食和日摄入情况各异，不提供个人时限。",
    "unsupportedInferences": [
      "进食时间永远不重要",
      "错过固定窗口就无法增肌"
    ],
    "topics": [
      "protein",
      "timing",
      "anabolic-window",
      "nutrition"
    ],
    "sources": [
      "X16"
    ],
    "evidenceType": "meta_analysis_meta_regression",
    "sourceSection": "Abstract; Results: full and protein-adjusted models",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  },
  {
    "id": "F61",
    "title": "比较训练频率对力量的影响也要控制总量",
    "text": "力量频率研究汇总中，未控制总量时较高频率更有利，但总量相等的研究没有明确差异。不能把多练几天本身当成独立保证；多数样本还是新手，对高经验训练者的证据有限。",
    "scope": "二十二项研究的力量结局；与既有增肌频率卡不同，不声称所有频率等效。",
    "unsupportedInferences": [
      "频率对任何人绝对无影响",
      "新手结果可无条件套给高级训练者"
    ],
    "topics": [
      "frequency",
      "volume",
      "strength",
      "training-status"
    ],
    "sources": [
      "X18"
    ],
    "evidenceType": "systematic_review_meta_analysis",
    "sourceSection": "Abstract: volume-equated subgroup; trained-population limitation",
    "reviewStatus": "ai-reviewed",
    "independentReview": "not-performed"
  }
];
