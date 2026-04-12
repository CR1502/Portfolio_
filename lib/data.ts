export interface Project {
  num: string;
  name: string;
  sub: string;
  date: string;
  desc: string;
  tags: string[];
  gh: string;
  demo?: string;
}

export interface SkillGroup {
  t: string;
  items: string[];
}

export interface ExperienceItem {
  date: string;
  company: string;
  role: string;
  loc: string;
  details: string[];
}

export interface EducationItem {
  deg: string;
  school: string;
  meta: string[];
  gpa: string;
  courses: string;
}

export const projects: Project[] = [
  {
    num: '01',
    name: 'AI Candidate Recommender',
    sub: 'Semantic Resume Matching Engine',
    date: 'Aug 2025',
    desc: 'End-to-end recruitment system using Sentence-BERT embeddings to match resumes with job descriptions, achieving 89% precision@5 across 100+ test candidates. Multi-format text extraction with 15+ regex patterns processing resumes in 3 seconds. Production-ready Streamlit app with 5-tier classification and FLAN-T5 AI summaries.',
    tags: ['Sentence-BERT', 'FLAN-T5', 'Streamlit', 'NLP', 'Classification'],
    gh: 'https://github.com/CR1502/CandidateRecommender',
    demo: 'https://candidaterecommender.streamlit.app/',
  },
  {
    num: '02',
    name: 'NomadAI',
    sub: 'Real-Time Travel Discovery Engine',
    date: 'Jul – Aug 2025',
    desc: 'RAG-powered travel platform processing 2,400+ Reddit discussions with location-specific extraction and sentiment classification across 25 destinations. Orchestrated real-time data pipelines integrating Reddit API, Google Places API, and AWS S3 with intelligent rate limiting.',
    tags: ['RAG', 'Reddit API', 'Google Places', 'AWS S3', 'Streamlit'],
    gh: 'https://github.com/CR1502/NomadAI',
    demo: 'https://nomadai.streamlit.app/',
  },
  {
    num: '03',
    name: 'SignSynth',
    sub: 'Gesture-Controlled MIDI Instrument',
    date: 'Jun – Jul 2025',
    desc: 'Real-time gesture-controlled MIDI instrument using OpenCV and MediaPipe, allowing users to play dual instruments with hand movements through a webcam. Gesture-to-chord mapping supporting multiple hand shapes with FluidSynth General MIDI playback.',
    tags: ['Python', 'OpenCV', 'MediaPipe', 'FluidSynth', 'MIDI', 'Computer Vision'],
    gh: 'https://github.com/CR1502/gesture_instrument',
  },
  {
    num: '04',
    name: 'MediScan',
    sub: 'Hybrid Medical Misinformation Classifier',
    date: 'Mar – Apr 2025',
    desc: 'Hybrid classification system combining BERT-based contextual embeddings with bagging ensemble methods, resulting in 5.2% improvement in factual claim detection. Flexible NLP pipeline leveraging LLM fine-tuning and LangChain integration with 78.4% test accuracy.',
    tags: ['BERT', 'LangChain', 'TF-IDF', 'Ensemble', 'PyTorch'],
    gh: 'https://github.com/CR1502/NLP-Project',
  },
  {
    num: '05',
    name: 'Chest X-R-AI',
    sub: 'Multi-Label Disease Diagnosis',
    date: 'Mar – Apr 2025',
    desc: 'Multi-label diagnostic system using ResNet-50 and Vision Transformers, classifying 14 thoracic diseases from X-ray images. 38.1% micro-F1 on ChestX-ray14, outperforming baseline CNN by 30.2%. GradCAM visualizations and MLFlow tracking over 500+ epochs.',
    tags: ['ResNet-50', 'Vision Transformers', 'GradCAM', 'MLFlow', 'TensorBoard'],
    gh: 'https://github.com/Airport237/Chest-X-R-AI',
  },
  {
    num: '06',
    name: 'PiGaze',
    sub: 'Real-Time Gaze Prediction System',
    date: 'Oct – Dec 2024',
    desc: 'CNN-based real-time gaze estimation trained on MPIIFaceGaze dataset with sub-0.5s response times, outperforming traditional tracking by 25% in latency. Data augmentation pipelines increasing training diversity by 30% and lowering MAE by 10.4%.',
    tags: ['CNN', 'OpenCV', 'NumPy', 'Pandas', 'Real-time'],
    gh: 'https://github.com/CR1502/PiGaze',
  },
  {
    num: '07',
    name: 'SoundScape',
    sub: 'Audio-to-Generative Artwork',
    date: 'Apr 2023',
    desc: 'System converting 10+ categories of sound input into dynamic, stylized images using custom CNN layers. Real-time audio capture with neural rendering enabling 95% fidelity in waveform-to-visual mapping.',
    tags: ['Python', 'OpenCV', 'CNN', 'Signal Processing'],
    gh: 'https://github.com/CR1502/tech-titans',
  },
  {
    num: '08',
    name: 'SmartSprout',
    sub: 'ANN-Driven Smart Irrigation',
    date: 'Feb 2023',
    desc: 'Artificial neural network trained on 2.1GB dataset to forecast irrigation needs with 70% accuracy. Interfaced with physical IoT sensors for real-time crop and weather metrics enabling automated water scheduling.',
    tags: ['TensorFlow', 'ANN', 'IoT', 'Smart Agriculture'],
    gh: 'https://github.com/CR1502/Smart-Irrigation',
  },
];

export const skills: SkillGroup[] = [
  { t: 'Programming', items: ['Python', 'C++', 'Java', 'SQL', 'Git', 'TypeScript'] },
  { t: 'Machine Learning', items: ['Scikit-learn', 'TensorFlow', 'PyTorch', 'Keras', 'HuggingFace'] },
  { t: 'Deep Learning', items: ['CNNs', 'Vision Transformers', 'Sequence Models', 'Generative Models', 'LLMs'] },
  { t: 'NLP', items: ['BERT', 'SBERT', 'TF-IDF', 'NER', 'Text Classification'] },
  { t: 'AI Systems', items: ['Prompting', 'RAG', 'AI Agents', 'Multi-Agent Orchestration', 'Memory Design'] },
  { t: 'Deployment', items: ['MLFlow', 'Databricks', 'Docker', 'Jenkins', 'Azure DevOps', 'Bitbucket', 'CI/CD'] },
  { t: 'Data Science', items: ['NumPy', 'Pandas', 'Matplotlib', 'Seaborn', 'Feature Engineering'] },
];

export const experience: ExperienceItem[] = [
  {
    date: 'Jan 2026 – Present',
    company: 'Staples',
    role: 'AI Engineer Co-op',
    loc: 'Framingham, MA',
    details: [
      'Architecting a multi-agent LLM orchestration system using LangGraph and LangChain to automate customer email categorization and structured extraction, deploying scalable inference pipelines on Databricks with experiment tracking, tracing, and A/B evaluation.',
      'Transforming an internal QA assistant into a context-aware conversational system by designing persistent memory architecture, containerizing services with Docker, and implementing CI/CD pipelines via Bitbucket, Jenkins, and Azure DevOps.',
    ],
  },
  {
    date: 'Sep 2025 – Dec 2025',
    company: 'Northeastern University',
    role: 'Graduate Teaching Assistant — CS5100: Foundations of AI',
    loc: 'Boston, MA',
    details: [
      'Supported instruction for graduate-level Foundations of AI course, assisting students with core concepts in search algorithms, probabilistic reasoning, and decision-making frameworks.',
    ],
  },
  {
    date: 'May 2025 – Aug 2025',
    company: 'Northeastern University',
    role: 'Graduate Teaching Assistant — CS6120: Natural Language Processing',
    loc: 'Boston, MA',
    details: [
      'Facilitated graduate-level NLP course covering word embeddings, text classification, language modeling, and syntactic parsing.',
      'Led lab sessions and tutorials on PyTorch, NLTK, spaCy, and LLM frameworks, guiding students in applying theoretical concepts to practical implementations.',
      'Held weekly office hours providing personalized support on advanced topics and helping students implement ML models for various NLP tasks.',
    ],
  },
  {
    date: 'Jun 2023 – Dec 2023',
    company: 'DeepRoot Minds Technologies',
    role: 'Machine Learning Intern',
    loc: 'Remote',
    details: [
      'Engineered CNN-based diagnostic models on 3,000+ clinical images, improving classification accuracy by 12%.',
      'Formulated a generative data augmentation workflow increasing dataset diversity and generalization by 10%.',
      'Refined model training pipelines with MLFlow, reducing iteration cycles by 40+ hours monthly.',
      'Collaborated with clinical teams for compliance alignment, decreasing review delays by 15%.',
    ],
  },
];

export const education: EducationItem[] = [
  {
    deg: 'MS in Artificial Intelligence',
    school: 'Northeastern University — Khoury College',
    meta: ['Sep 2024 – May 2026', 'Boston, MA'],
    gpa: '3.83/4.0',
    courses: 'AI Capstone, Linear Algebra & Probability, Applied Programming for AI, Machine Learning, NLP, Algorithms, Foundations of AI',
  },
  {
    deg: 'B.Tech in CS — AI & ML',
    school: 'VIT Bhopal University',
    meta: ['Jul 2020 – May 2024', 'Bhopal, India'],
    gpa: '3.52/4.0',
    courses: 'Data Structures, DBMS, Discrete Mathematics, Foundations of Machine Learning',
  },
];

export const tickerItems: string[] = [
  'epoch 147/200',
  'loss: 0.0234 ↓',
  'acc: 96.1%',
  'BERT-base',
  'batch: 128',
  'lr: 3e-4',
  'F1: 0.934',
  'A100 80GB',
  'CONVERGING',
  'params: 110M',
];

export const tokenPool: string[] = [
  'attention', 'query', 'key', 'value', 'embedding', 'softmax',
  'transformer', 'token', 'logits', 'MLP', 'LayerNorm', 'residual',
  'position', 'mask', 'context', 'decode', 'encode', 'hidden',
  'gradient', 'loss', 'RLHF', 'prompt', 'agent', 'memory',
  'vector', 'retrieval', 'generate', 'inference', 'finetune',
  'weights', 'multi-head', 'cross-attn', 'self-attn', 'KV-cache',
  'top-p', 'tokenize', 'beam', 'SwiGLU', 'RoPE',
];

export const dataStreamItems: string[] = [
  'Q·K^T/√d', 'attn:32', 'ctx:128k', 'top_p:.95', 'tok/s:847',
  'KV-cache', 'RoPE(θ)', 'SwiGLU', 'RLHF', 'dim:4096',
  'beam:4', 'loss:.023', 'epoch:147', 'F1:.934', 'acc:96.1',
  'lr:3e-4', 'batch:128', 'SBERT', 'RAG', 'agent',
];
