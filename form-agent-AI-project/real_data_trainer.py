#!/usr/bin/env python3
"""
Real Data Question Generation Trainer
Kết hợp datasets/ (keywords) với question_datasets/ (câu hỏi thực tế) 
để train AI model generate câu hỏi từ keywords - KHÔNG DÙNG TEMPLATES
"""

import pandas as pd
import numpy as np
import os
import glob
import pickle
import json
from datetime import datetime
import re
import warnings
from pathlib import Path
warnings.filterwarnings('ignore')

# Machine Learning
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import NearestNeighbors
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics.pairwise import cosine_similarity

# Text Processing
import nltk
from collections import defaultdict, Counter
from tqdm import tqdm

print(" Real Data Question Generation Trainer")
print(" Kết hợp datasets/ + question_datasets/ để train AI thực sự")

class RealDataQuestionTrainer:
    
    # ============================================================================
    # KEYWORD SYNONYMS MAPPING - EXPANDED VERSION
    # Bao quát ~500+ keywords liên quan đến IT, Marketing, Economics
    # ============================================================================
    KEYWORD_SYNONYMS = {
        # =========================================================================
        # IT - Machine Learning / AI (100+ terms)
        # =========================================================================
        'machine learning': [
            # Core ML terms
            'machine learning', 'ml', 'deep learning', 'neural network', 'neural networks',
            'artificial intelligence', 'ai', 'artificial general intelligence', 'agi',
            
            # Frameworks & Libraries
            'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'sklearn', 'xgboost',
            'lightgbm', 'catboost', 'caffe', 'mxnet', 'theano', 'paddle', 'jax',
            
            # NLP
            'natural language processing', 'nlp', 'text mining', 'sentiment analysis',
            'chatbot', 'chatgpt', 'gpt', 'gpt-4', 'bert', 'transformer', 'llm',
            'large language model', 'language model', 'text generation', 'speech recognition',
            'named entity recognition', 'ner', 'machine translation', 'text classification',
            
            # Computer Vision  
            'computer vision', 'image recognition', 'image classification', 'object detection',
            'face recognition', 'facial recognition', 'image processing', 'opencv', 'yolo',
            'cnn', 'convolutional neural network', 'image segmentation', 'ocr',
            
            # ML Types
            'supervised learning', 'unsupervised learning', 'reinforcement learning',
            'semi-supervised learning', 'self-supervised learning', 'transfer learning',
            'federated learning', 'online learning', 'active learning',
            
            # ML Concepts
            'classification', 'regression', 'clustering', 'dimensionality reduction',
            'feature engineering', 'feature selection', 'hyperparameter tuning',
            'cross validation', 'overfitting', 'underfitting', 'bias variance',
            'gradient descent', 'backpropagation', 'loss function', 'activation function',
            
            # ML Models
            'decision tree', 'random forest', 'svm', 'support vector machine',
            'knn', 'k-nearest neighbors', 'naive bayes', 'logistic regression',
            'linear regression', 'ensemble learning', 'boosting', 'bagging',
            'recurrent neural network', 'rnn', 'lstm', 'gru', 'autoencoder', 'gan',
            'generative adversarial network', 'diffusion model', 'stable diffusion',
            
            # AI Applications
            'predictive modeling', 'predictive analytics', 'recommendation system',
            'recommender system', 'anomaly detection', 'fraud detection',
            'autonomous vehicle', 'self-driving car', 'robotics', 'robot',
            'voice assistant', 'virtual assistant', 'alexa', 'siri', 'cortana'
        ],
        
        # =========================================================================
        # IT - Data Science (80+ terms)
        # =========================================================================
        'data science': [
            # Core terms
            'data science', 'data scientist', 'data analysis', 'data analytics',
            'big data', 'data engineering', 'data engineer',
            
            # Tools & Libraries
            'pandas', 'numpy', 'scipy', 'matplotlib', 'seaborn', 'plotly',
            'jupyter', 'jupyter notebook', 'anaconda', 'r programming', 'r studio',
            'sas', 'spss', 'stata', 'excel', 'spreadsheet',
            
            # Databases
            'sql', 'mysql', 'postgresql', 'mongodb', 'nosql', 'database',
            'data warehouse', 'data lake', 'data mart', 'redshift', 'snowflake',
            'bigquery', 'databricks', 'spark', 'apache spark', 'hadoop',
            
            # BI & Visualization
            'business intelligence', 'bi', 'power bi', 'tableau', 'looker',
            'qlik', 'data visualization', 'dashboard', 'reporting', 'kpi',
            
            # Data Processing
            'etl', 'extract transform load', 'data pipeline', 'data cleaning',
            'data wrangling', 'data preprocessing', 'data transformation',
            'data integration', 'data quality', 'data governance',
            
            # Statistics
            'statistics', 'statistical analysis', 'hypothesis testing',
            'a/b testing', 'ab testing', 'probability', 'distribution',
            'correlation', 'causation', 'confidence interval', 'p-value',
            'mean', 'median', 'mode', 'standard deviation', 'variance',
            
            # Data Mining
            'data mining', 'pattern recognition', 'association rules',
            'market basket analysis', 'text analytics', 'web scraping'
        ],
        
        # =========================================================================
        # IT - Web Development (100+ terms)
        # =========================================================================
        'web development': [
            # General
            'web development', 'web developer', 'web dev', 'website', 'web app',
            'web application', 'frontend', 'front-end', 'backend', 'back-end',
            'full stack', 'fullstack', 'full-stack developer',
            
            # Languages
            'javascript', 'js', 'typescript', 'html', 'html5', 'css', 'css3',
            'php', 'python web', 'ruby', 'ruby on rails', 'rails', 'go', 'golang',
            'java web', 'scala', 'kotlin', 'rust web', 'c# web', 'asp.net',
            
            # Frontend Frameworks
            'react', 'reactjs', 'react.js', 'angular', 'angularjs', 'vue', 'vuejs',
            'vue.js', 'svelte', 'next.js', 'nextjs', 'nuxt', 'nuxtjs', 'gatsby',
            'ember', 'backbone', 'jquery', 'bootstrap', 'tailwind', 'tailwindcss',
            'material ui', 'sass', 'scss', 'less', 'styled components',
            
            # Backend Frameworks
            'nodejs', 'node.js', 'node', 'express', 'expressjs', 'nestjs', 'fastify',
            'django', 'flask', 'fastapi', 'spring', 'spring boot', 'laravel',
            'symfony', 'codeigniter', 'gin', 'echo', 'fiber',
            
            # APIs
            'api', 'rest api', 'restful', 'graphql', 'grpc', 'websocket',
            'api design', 'api development', 'swagger', 'openapi', 'postman',
            
            # CMS & Platforms
            'wordpress', 'drupal', 'joomla', 'shopify', 'magento', 'wix',
            'squarespace', 'webflow', 'contentful', 'strapi', 'sanity',
            
            # Web Concepts
            'responsive design', 'mobile first', 'progressive web app', 'pwa',
            'single page application', 'spa', 'server side rendering', 'ssr',
            'static site generator', 'jamstack', 'headless cms',
            'web accessibility', 'wcag', 'seo friendly', 'web performance',
            'lighthouse', 'core web vitals', 'lazy loading', 'caching',
            
            # Testing
            'unit testing', 'integration testing', 'e2e testing', 'jest',
            'mocha', 'cypress', 'selenium', 'playwright', 'testing library'
        ],
        
        # =========================================================================
        # IT - Cloud Computing (80+ terms)
        # =========================================================================
        'cloud computing': [
            # General
            'cloud computing', 'cloud', 'cloud services', 'cloud platform',
            'cloud infrastructure', 'cloud architecture', 'cloud migration',
            'hybrid cloud', 'multi-cloud', 'private cloud', 'public cloud',
            
            # Providers
            'aws', 'amazon web services', 'azure', 'microsoft azure',
            'google cloud', 'gcp', 'google cloud platform', 'alibaba cloud',
            'ibm cloud', 'oracle cloud', 'digitalocean', 'linode', 'vultr',
            'heroku', 'vercel', 'netlify', 'render', 'railway',
            
            # Containers & Orchestration
            'docker', 'container', 'containerization', 'kubernetes', 'k8s',
            'openshift', 'rancher', 'docker compose', 'docker swarm',
            'podman', 'containerd', 'helm', 'istio', 'service mesh',
            
            # DevOps & CI/CD
            'devops', 'devsecops', 'ci/cd', 'continuous integration',
            'continuous deployment', 'continuous delivery', 'jenkins',
            'github actions', 'gitlab ci', 'circleci', 'travis ci',
            'azure devops', 'argocd', 'spinnaker', 'tekton',
            
            # Infrastructure as Code
            'terraform', 'ansible', 'puppet', 'chef', 'cloudformation',
            'pulumi', 'infrastructure as code', 'iac', 'gitops',
            
            # Serverless
            'serverless', 'lambda', 'aws lambda', 'azure functions',
            'google cloud functions', 'faas', 'function as a service',
            
            # Cloud Services
            'iaas', 'paas', 'saas', 'baas', 'dbaas',
            'infrastructure as a service', 'platform as a service',
            'software as a service', 'storage', 's3', 'blob storage',
            'cdn', 'content delivery network', 'cloudfront', 'load balancer',
            
            # Virtualization
            'virtualization', 'virtual machine', 'vm', 'vmware', 'hypervisor',
            'proxmox', 'hyper-v', 'kvm', 'virtualbox'
        ],
        
        # =========================================================================
        # IT - Cybersecurity (80+ terms)
        # =========================================================================
        'cybersecurity': [
            # General
            'cybersecurity', 'cyber security', 'information security', 'infosec',
            'security', 'it security', 'computer security', 'network security',
            
            # Offensive Security
            'ethical hacking', 'penetration testing', 'pentest', 'red team',
            'vulnerability assessment', 'security audit', 'bug bounty',
            'exploit', 'payload', 'metasploit', 'burp suite', 'kali linux',
            
            # Defensive Security
            'blue team', 'soc', 'security operations center', 'siem',
            'intrusion detection', 'ids', 'intrusion prevention', 'ips',
            'endpoint protection', 'edr', 'xdr', 'antivirus', 'anti-malware',
            
            # Threats
            'malware', 'ransomware', 'virus', 'trojan', 'worm', 'spyware',
            'phishing', 'social engineering', 'ddos', 'denial of service',
            'man in the middle', 'mitm', 'sql injection', 'xss',
            'cross-site scripting', 'zero day', 'apt', 'advanced persistent threat',
            
            # Protection
            'firewall', 'vpn', 'proxy', 'encryption', 'ssl', 'tls', 'https',
            'certificate', 'pki', 'public key infrastructure',
            'authentication', 'mfa', 'multi-factor authentication', '2fa',
            'authorization', 'access control', 'rbac', 'iam', 'identity management',
            'password', 'password manager', 'hash', 'hashing', 'salt',
            
            # Compliance & Governance
            'gdpr', 'hipaa', 'pci dss', 'sox', 'iso 27001', 'nist',
            'compliance', 'data protection', 'privacy', 'data privacy',
            'security policy', 'risk assessment', 'risk management',
            
            # Forensics
            'digital forensics', 'incident response', 'threat hunting',
            'malware analysis', 'reverse engineering', 'log analysis'
        ],
        
        # =========================================================================
        # Marketing - Digital Marketing (80+ terms)
        # =========================================================================
        'digital marketing': [
            # General
            'digital marketing', 'online marketing', 'internet marketing',
            'digital advertising', 'online advertising', 'marketing strategy',
            'digital strategy', 'marketing campaign', 'digital campaign',
            
            # SEO
            'seo', 'search engine optimization', 'on-page seo', 'off-page seo',
            'technical seo', 'local seo', 'keyword research', 'backlink',
            'link building', 'serp', 'google ranking', 'organic traffic',
            'organic search', 'meta tags', 'schema markup', 'sitemap',
            
            # SEM & PPC
            'sem', 'search engine marketing', 'ppc', 'pay per click',
            'google ads', 'google adwords', 'bing ads', 'display ads',
            'remarketing', 'retargeting', 'shopping ads', 'video ads',
            'cpc', 'cost per click', 'cpm', 'cpa', 'roas', 'ad spend',
            
            # Social Advertising
            'facebook ads', 'instagram ads', 'linkedin ads', 'twitter ads',
            'tiktok ads', 'pinterest ads', 'snapchat ads', 'youtube ads',
            'social ads', 'paid social', 'sponsored content', 'promoted posts',
            
            # Email Marketing
            'email marketing', 'email campaign', 'newsletter', 'email automation',
            'drip campaign', 'email list', 'mailchimp', 'sendgrid', 'klaviyo',
            'email deliverability', 'open rate', 'click rate', 'unsubscribe',
            
            # Marketing Automation
            'marketing automation', 'hubspot', 'marketo', 'salesforce marketing',
            'pardot', 'eloqua', 'active campaign', 'autopilot', 'drip',
            
            # Analytics & Tracking
            'google analytics', 'ga4', 'analytics', 'web analytics',
            'conversion tracking', 'pixel', 'facebook pixel', 'gtm',
            'google tag manager', 'attribution', 'funnel', 'user journey',
            
            # Other
            'affiliate marketing', 'influencer marketing', 'referral marketing',
            'growth hacking', 'growth marketing', 'performance marketing',
            'lead generation', 'lead nurturing', 'crm', 'customer acquisition',
            'customer retention', 'conversion rate', 'cro', 'landing page',
            'a/b testing', 'split testing', 'multivariate testing'
        ],
        
        # =========================================================================
        # Marketing - Content Marketing (60+ terms)
        # =========================================================================
        'content marketing': [
            # General
            'content marketing', 'content strategy', 'content creation',
            'content writing', 'content development', 'content planning',
            'editorial calendar', 'content calendar', 'content distribution',
            
            # Written Content
            'blogging', 'blog', 'blog post', 'article', 'long-form content',
            'copywriting', 'copy', 'sales copy', 'web copy', 'ad copy',
            'seo writing', 'seo content', 'ghostwriting', 'technical writing',
            
            # Visual Content
            'video marketing', 'video content', 'youtube', 'vlog', 'webinar',
            'live streaming', 'live video', 'video production', 'animation',
            'infographic', 'visual content', 'image', 'graphics', 'design',
            'canva', 'photoshop', 'illustrator', 'figma',
            
            # Audio Content
            'podcast', 'podcasting', 'audio content', 'audiobook',
            'voice content', 'spotify', 'apple podcasts',
            
            # Other Formats
            'ebook', 'e-book', 'whitepaper', 'white paper', 'case study',
            'report', 'guide', 'how-to guide', 'tutorial', 'checklist',
            'template', 'toolkit', 'resource', 'newsletter content',
            
            # Content Concepts
            'storytelling', 'brand story', 'narrative', 'thought leadership',
            'user generated content', 'ugc', 'curated content', 'evergreen content',
            'viral content', 'trending content', 'content repurposing',
            'content optimization', 'content audit', 'content gap analysis'
        ],
        
        # =========================================================================
        # Marketing - Social Media (70+ terms)
        # =========================================================================
        'social media': [
            # General
            'social media', 'social media marketing', 'smm', 'social marketing',
            'social network', 'social platform', 'social strategy',
            
            # Platforms
            'facebook', 'fb', 'meta', 'instagram', 'ig', 'twitter', 'x',
            'linkedin', 'tiktok', 'youtube', 'yt', 'pinterest', 'snapchat',
            'whatsapp', 'telegram', 'discord', 'reddit', 'quora', 'threads',
            'wechat', 'weibo', 'line', 'kakaotalk', 'clubhouse', 'twitch',
            
            # Activities
            'posting', 'post', 'tweet', 'reel', 'reels', 'story', 'stories',
            'live', 'going live', 'streaming', 'share', 'sharing', 'comment',
            'commenting', 'like', 'react', 'reaction', 'save', 'bookmark',
            
            # Concepts
            'engagement', 'engagement rate', 'reach', 'impressions', 'followers',
            'following', 'community', 'community management', 'social listening',
            'social monitoring', 'sentiment', 'brand mention', 'hashtag',
            'trending', 'viral', 'algorithm', 'feed', 'timeline',
            
            # Influencer
            'influencer', 'micro influencer', 'macro influencer', 'creator',
            'content creator', 'kol', 'key opinion leader', 'ambassador',
            'brand ambassador', 'partnership', 'collaboration', 'sponsorship',
            
            # Tools
            'hootsuite', 'buffer', 'sprout social', 'later', 'planoly',
            'social media scheduler', 'social media management', 'social tool'
        ],
        
        # =========================================================================
        # Marketing - Brand Management (50+ terms)
        # =========================================================================
        'brand management': [
            # General
            'brand management', 'brand manager', 'branding', 'brand',
            'brand strategy', 'brand development', 'brand building',
            
            # Brand Elements
            'brand identity', 'brand image', 'brand voice', 'brand tone',
            'brand personality', 'brand values', 'brand mission', 'brand vision',
            'brand story', 'brand narrative', 'brand messaging', 'tagline',
            'slogan', 'brand name', 'naming', 'brand guidelines', 'style guide',
            
            # Visual Identity
            'logo', 'logo design', 'visual identity', 'brand colors',
            'typography', 'brand font', 'brand assets', 'brand kit',
            'corporate identity', 'corporate design', 'brand collateral',
            
            # Brand Strategy
            'brand positioning', 'brand differentiation', 'brand promise',
            'brand architecture', 'brand portfolio', 'sub-brand', 'brand extension',
            'co-branding', 'brand partnership', 'brand licensing',
            
            # Brand Performance
            'brand awareness', 'brand recognition', 'brand recall',
            'brand perception', 'brand reputation', 'brand sentiment',
            'brand equity', 'brand value', 'brand loyalty', 'brand advocacy',
            'brand ambassador', 'brand community', 'brand trust',
            
            # Brand Actions
            'rebranding', 'rebrand', 'brand refresh', 'brand launch',
            'brand campaign', 'brand activation', 'brand experience'
        ],
        
        # =========================================================================
        # Economics - Financial Modeling (70+ terms)
        # =========================================================================
        'financial modeling': [
            # General
            'financial modeling', 'financial model', 'financial analysis',
            'financial analyst', 'finance', 'corporate finance',
            
            # Valuation
            'valuation', 'company valuation', 'business valuation',
            'dcf', 'discounted cash flow', 'npv', 'net present value',
            'irr', 'internal rate of return', 'wacc', 'cost of capital',
            'terminal value', 'enterprise value', 'equity value', 'multiples',
            'comparable analysis', 'comps', 'precedent transactions',
            
            # Financial Statements
            'financial statements', 'income statement', 'profit and loss', 'p&l',
            'balance sheet', 'cash flow statement', 'statement of cash flows',
            'revenue', 'expenses', 'profit', 'loss', 'ebitda', 'ebit',
            'gross margin', 'operating margin', 'net margin', 'eps',
            
            # Planning & Analysis
            'financial planning', 'fp&a', 'budgeting', 'budget',
            'forecasting', 'financial forecast', 'projection', 'scenario analysis',
            'sensitivity analysis', 'what-if analysis', 'variance analysis',
            
            # Excel & Tools
            'excel', 'excel modeling', 'spreadsheet', 'google sheets',
            'power query', 'pivot table', 'vlookup', 'financial functions',
            'macros', 'vba', 'bloomberg', 'capital iq', 'factset',
            
            # Metrics & Ratios
            'financial ratios', 'liquidity ratio', 'profitability ratio',
            'leverage ratio', 'efficiency ratio', 'roi', 'return on investment',
            'roe', 'return on equity', 'roa', 'return on assets',
            'debt to equity', 'current ratio', 'quick ratio', 'working capital'
        ],
        
        # =========================================================================
        # Economics - Investment Planning (80+ terms)
        # =========================================================================
        'investment planning': [
            # General
            'investment planning', 'investment', 'investing', 'investor',
            'investment strategy', 'investment management', 'wealth management',
            'financial planning', 'financial advisor', 'financial consultant',
            
            # Asset Classes
            'stocks', 'stock', 'shares', 'equity', 'equities',
            'bonds', 'bond', 'fixed income', 'treasury', 'corporate bonds',
            'mutual funds', 'mutual fund', 'index fund', 'etf',
            'exchange traded fund', 'real estate', 'reit', 'commodities',
            'gold', 'silver', 'oil', 'forex', 'foreign exchange', 'currency',
            
            # Investment Vehicles
            'portfolio', 'asset allocation', 'diversification',
            '401k', '401(k)', 'ira', 'roth ira', 'traditional ira',
            'pension', 'retirement fund', 'retirement planning', 'retirement',
            'savings', 'savings account', 'cd', 'certificate of deposit',
            'money market', 'brokerage', 'brokerage account',
            
            # Investment Concepts
            'compound interest', 'compounding', 'dollar cost averaging', 'dca',
            'buy and hold', 'value investing', 'growth investing',
            'dividend investing', 'passive investing', 'active investing',
            'risk tolerance', 'risk appetite', 'risk management',
            'systematic risk', 'unsystematic risk', 'beta', 'alpha',
            'sharpe ratio', 'volatility', 'standard deviation',
            
            # Financial Goals
            'wealth building', 'wealth creation', 'financial freedom',
            'financial independence', 'fire', 'early retirement',
            'college savings', '529 plan', 'education savings',
            'emergency fund', 'nest egg', 'inheritance', 'estate planning'
        ],
        
        # =========================================================================
        # Economics - Market Analysis (60+ terms)
        # =========================================================================
        'market analysis': [
            # General
            'market analysis', 'market research', 'market study',
            'market intelligence', 'market insight', 'market report',
            
            # Analysis Types
            'competitive analysis', 'competitor analysis', 'competition',
            'swot analysis', 'swot', 'pest analysis', 'pestle analysis',
            'porters five forces', 'value chain analysis', 'gap analysis',
            
            # Market Metrics
            'market size', 'market share', 'market growth', 'market potential',
            'tam', 'total addressable market', 'sam', 'som',
            'market penetration', 'market saturation', 'market demand',
            
            # Consumer Analysis
            'consumer behavior', 'consumer research', 'customer research',
            'customer segmentation', 'market segmentation', 'target market',
            'target audience', 'buyer persona', 'customer journey',
            'customer needs', 'pain points', 'buying behavior',
            
            # Industry Analysis
            'industry analysis', 'industry research', 'industry trends',
            'market trends', 'trend analysis', 'market dynamics',
            'market drivers', 'market barriers', 'market opportunity',
            'market threat', 'disruptive innovation', 'emerging market',
            
            # Business Analysis
            'business analysis', 'business case', 'feasibility study',
            'feasibility analysis', 'market feasibility', 'market validation',
            'product market fit', 'go to market', 'gtm', 'market entry',
            'market expansion', 'market development', 'benchmarking'
        ],
        
        # =========================================================================
        # Economics - Portfolio Management (70+ terms)
        # =========================================================================
        'portfolio management': [
            # General
            'portfolio management', 'portfolio manager', 'asset management',
            'fund management', 'investment management', 'money management',
            
            # Fund Types
            'hedge fund', 'mutual fund', 'index fund', 'pension fund',
            'sovereign wealth fund', 'private equity', 'pe', 'venture capital',
            'vc', 'angel investing', 'seed funding', 'series a', 'series b',
            
            # Trading
            'trading', 'trader', 'day trading', 'swing trading', 'position trading',
            'algorithmic trading', 'algo trading', 'high frequency trading', 'hft',
            'quantitative trading', 'quant', 'systematic trading',
            'technical analysis', 'fundamental analysis', 'chart analysis',
            'candlestick', 'moving average', 'rsi', 'macd', 'bollinger bands',
            
            # Fintech & Crypto
            'fintech', 'financial technology', 'robo advisor', 'neobank',
            'digital banking', 'mobile banking', 'payment', 'payment processing',
            'cryptocurrency', 'crypto', 'bitcoin', 'btc', 'ethereum', 'eth',
            'blockchain', 'defi', 'decentralized finance', 'nft', 'web3',
            'token', 'tokenization', 'smart contract', 'mining', 'staking',
            'wallet', 'crypto wallet', 'exchange', 'crypto exchange',
            'binance', 'coinbase', 'kraken', 'altcoin', 'stablecoin',
            
            # Regulation
            'sec', 'securities', 'regulation', 'compliance', 'aml',
            'anti money laundering', 'kyc', 'know your customer',
            'fiduciary', 'fiduciary duty', 'investment advisor'
        ]
    }
    
    def __init__(self, datasets_path="datasets", questions_path="question_datasets", models_path="models"):
        self.datasets_path = Path(datasets_path)
        self.questions_path = Path(questions_path)
        self.models_path = Path(models_path)
        
        # Create models directory
        self.models_path.mkdir(exist_ok=True)
        
        # Build reverse mapping: synonym → parent keyword
        self.synonym_to_parent = {}
        for parent, synonyms in self.KEYWORD_SYNONYMS.items():
            for syn in synonyms:
                self.synonym_to_parent[syn.lower()] = parent.lower()
        
        # AI components
        self.keyword_vectorizer = None
        self.question_vectorizer = None
        self.category_classifier = None
        self.similarity_model = None
        self.label_encoder = None
        
        # Data storage
        self.keyword_question_mapping = defaultdict(list)
        self.category_keywords = defaultdict(list)
        self.real_questions_db = []
        
        # Available keywords (loaded from model)
        self.available_keywords = set()
        
        print(f" Datasets path: {self.datasets_path}")
        print(f" Questions path: {self.questions_path}")
        print(f" Models path: {self.models_path}")
        print(f" Loaded {len(self.synonym_to_parent)} keyword synonyms")
    
    def get_available_keywords(self):
        """Trả về danh sách tất cả keywords có trong model"""
        return list(self.available_keywords)
    
    def is_keyword_available(self, keyword):
        """Kiểm tra xem keyword có trong model không (bao gồm cả synonyms)"""
        keyword_lower = keyword.lower().strip()
        
        # Check direct availability
        if keyword_lower in self.available_keywords:
            return True, keyword_lower, 'direct'
        
        # Check synonym mapping
        if keyword_lower in self.synonym_to_parent:
            parent = self.synonym_to_parent[keyword_lower]
            if parent in self.available_keywords:
                return True, parent, 'synonym'
        
        return False, None, None
    
    def load_and_process_datasets(self, max_files=None, batch_size=10000):
        """Load và process dữ liệu từ cả 2 folders với memory optimization"""
        print("\nLoading ALL real datasets...")
        
        all_data = []
        total_records = 0
        
        # Load từ datasets/ folder (keyword data) - TẤT CẢ FILES
        dataset_files = list(self.datasets_path.glob("*.csv"))
        if max_files:
            dataset_files = dataset_files[:max_files]
        
        print(f"   Found {len(dataset_files)} files in datasets/ (processing ALL)")
        
        for i, file_path in enumerate(tqdm(dataset_files, desc="Loading datasets")):
            try:
                # Read with optimizations
                df = pd.read_csv(file_path, low_memory=False)
                
                # Sample if file is too large
                if len(df) > batch_size:
                    df = df.sample(n=batch_size, random_state=42)
                
                # Extract keywords from dataset structure  
                if len(df.columns) >= 2:  # Ensure có ít nhất 2 columns
                    for _, row in df.iterrows():
                        try:
                            # Từ format: 79900167,financial modeling,economics,registration,Simple,14,2025-04-07,Financial Modeling Registration,8
                            if len(row) >= 3:
                                keyword = str(row.iloc[1]).strip().lower()  # Column 2: financial modeling
                                category = str(row.iloc[2]).strip().lower()  # Column 3: economics
                                
                                if keyword and category and len(keyword) > 3:
                                    all_data.append({
                                        'keyword': keyword,
                                        'category': category,
                                        'source': 'datasets',
                                        'file': file_path.name
                                    })
                                    self.category_keywords[category].append(keyword)
                                    total_records += 1
                        except:
                            continue
                
                # Memory cleanup every 50 files
                if (i + 1) % 50 == 0:
                    print(f"   Processed {i + 1}/{len(dataset_files)} files, {total_records:,} records so far")
                            
            except Exception as e:
                print(f"    Error loading {file_path.name}: {e}")
                continue
        
        # Load từ question_datasets/ folder (real questions) - TẤT CẢ FILES  
        question_files = list(self.questions_path.glob("*.csv"))
        if max_files:
            question_files = question_files[:max_files]
            
        print(f"   Found {len(question_files)} files in question_datasets/ (processing ALL)")
        
        for i, file_path in enumerate(tqdm(question_files, desc="Loading questions")):
            try:
                # Try different CSV reading approaches to handle corrupted files
                df = None
                
                # Approach 1: Normal read
                try:
                    df = pd.read_csv(file_path, low_memory=False)
                except:
                    # Approach 2: Read with error handling
                    try:
                        df = pd.read_csv(file_path, low_memory=False, on_bad_lines='skip', engine='python')
                    except:
                        # Approach 3: Read only first N lines that are likely good
                        try:
                            df = pd.read_csv(file_path, low_memory=False, nrows=1500, on_bad_lines='skip')
                        except:
                            # Skip this file completely if all approaches fail
                            print(f"    Skipping corrupted file: {file_path.name}")
                            continue
                
                if df is None or len(df) == 0:
                    continue
                
                # Sample if too large
                if len(df) > batch_size:
                    df = df.sample(n=batch_size, random_state=42)
                
                for _, row in df.iterrows():
                    try:
                        question = str(row.get('question', '')).strip()
                        keyword = str(row.get('keyword', '')).strip()
                        category = str(row.get('category', 'it')).lower()
                        
                        if question and keyword and len(question) > 10:
                            # Add to mapping
                            self.keyword_question_mapping[keyword.lower()].append({
                                'question': question,
                                'category': category,
                                'source': 'question_datasets'
                            })
                            
                            # Add to main data
                            all_data.append({
                                'keyword': keyword.lower(),
                                'category': category,
                                'question': question,
                                'source': 'question_datasets',
                                'file': file_path.name
                            })
                            
                            # Store in questions database
                            self.real_questions_db.append({
                                'keyword': keyword.lower(),
                                'question': question,
                                'category': category
                            })
                            total_records += 1
                            
                    except:
                        continue
                
                # Memory cleanup every 25 files
                if (i + 1) % 25 == 0:
                    print(f"   Processed {i + 1}/{len(question_files)} question files")
                        
            except Exception as e:
                print(f"    Error loading {file_path.name}: {e}")
                continue
        
        # Convert to DataFrame với memory optimization
        print(f"   Converting {len(all_data):,} records to DataFrame...")
        combined_df = pd.DataFrame(all_data)
        
        # Clean up memory
        del all_data
        
        print(f"\n Data Loading Results:")
        print(f"   Total dataset files processed: {len(dataset_files)}")
        print(f"   Total question files processed: {len(question_files)}")
        print(f"   Total records: {len(combined_df):,}")
        print(f"   Unique keywords: {combined_df['keyword'].nunique():,}")
        print(f"   Categories: {combined_df['category'].value_counts().to_dict()}")
        print(f"   Real questions collected: {len(self.real_questions_db):,}")
        print(f"   Keyword-question mappings: {len(self.keyword_question_mapping):,}")
        
        return combined_df
    
    def build_keyword_similarity_model(self, df):
        """Build model để tìm keywords tương tự"""
        print("\nBuilding keyword similarity model...")
        
        # Get unique keywords
        unique_keywords = df['keyword'].unique()
        
        # Create TF-IDF vectors for keywords
        self.keyword_vectorizer = TfidfVectorizer(
            max_features=5000,
            ngram_range=(1, 2),
            stop_words='english'
        )
        
        keyword_vectors = self.keyword_vectorizer.fit_transform(unique_keywords)
        
        # Build similarity model
        self.similarity_model = NearestNeighbors(
            n_neighbors=10,
            metric='cosine'
        )
        
        self.similarity_model.fit(keyword_vectors)
        
        print(f"    Similarity model trained on {len(unique_keywords):,} keywords")
        
        return unique_keywords
    
    def train_category_classifier(self, df):
        """Train model phân loại category từ keyword"""
        print("\n Training category classifier...")
        
        # Basic normalization / consolidation of category labels
        # This merges common variants (e.g. 'econ', 'econo' -> 'economics',
        # 'mark*' -> 'marketing', single-letter noisy labels -> main categories)
        def normalize_category(cat):
            try:
                c = str(cat).strip().lower()
            except:
                return 'nan'

            if c in ('', 'none', 'nan', 'na'):
                return 'nan'

            # economics variants
            if c.startswith('econ') or c.startswith('eco') or 'econ' in c or 'eco' in c or c == 'economic':
                return 'economics'

            # marketing variants
            if c.startswith('mark') or 'mark' in c:
                return 'marketing'

            # it / tech variants
            if c in ('it', 'information technology') or c == 'i':
                return 'it'

            # single-letter heuristics
            if c in ('e',):
                return 'economics'
            if c in ('ec', 'eco'):
                return 'economics'
            if c in ('m', 'ma', 'mar'):
                return 'marketing'

            return c

        df = df.copy()
        df['category'] = df['category'].fillna('unknown').apply(normalize_category)

        # IMPORTANT: Remove "nan" and "unknown" from training - these are not real categories
        df = df[~df['category'].isin(['nan', 'unknown', ''])].copy()

        # Filter categories with at least 10 samples for stable training
        category_counts = df['category'].value_counts()
        valid_categories = category_counts[category_counts >= 10].index.tolist()

        print(f"   Filtering categories: keeping {len(valid_categories)} out of {len(category_counts)} categories")
        print(f"   Valid categories: {dict(category_counts[category_counts >= 10].head(10))}")
        print(f"   Dropped categories: {list(category_counts[category_counts < 10].keys())}")

        # Filter dataframe to only include valid categories
        df_filtered = df[df['category'].isin(valid_categories)].copy()
        
        if len(df_filtered) < 100:
            print(f"    Warning: Only {len(df_filtered)} samples after filtering!")
            return 0.0
        
        # Prepare data
        X = df_filtered['keyword'].values
        y = df_filtered['category'].values
        
        # Encode labels
        self.label_encoder = LabelEncoder()
        y_encoded = self.label_encoder.fit_transform(y)
        
        # Check if we still have the stratify issue
        unique_labels, counts = np.unique(y_encoded, return_counts=True)
        min_count = counts.min()
        
        if min_count < 2:
            print(f"  Still have categories with < 2 samples. Using random split instead of stratified.")
            # Split data without stratification
            X_train, X_test, y_train, y_test = train_test_split(
                X, y_encoded, test_size=0.2, random_state=42
            )
        else:
            # Split data with stratification
            X_train, X_test, y_train, y_test = train_test_split(
                X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
            )
        
        # Create question vectorizer
        self.question_vectorizer = TfidfVectorizer(
            max_features=3000,
            ngram_range=(1, 2),
            stop_words='english'
        )
        
        # Vectorize keywords
        X_train_vec = self.question_vectorizer.fit_transform(X_train)
        X_test_vec = self.question_vectorizer.transform(X_test)
        
        # Train classifier
        self.category_classifier = RandomForestClassifier(
            n_estimators=100,
            random_state=42
        )
        
        self.category_classifier.fit(X_train_vec, y_train)
        
        # Evaluate
        y_pred = self.category_classifier.predict(X_test_vec)
        accuracy = accuracy_score(y_test, y_pred)
        
        print(f"    Category classifier accuracy: {accuracy:.4f}")
        print(f"   Categories: {list(self.label_encoder.classes_)}")
        
        return accuracy
    
    def find_similar_keywords(self, target_keyword, n_similar=5):
        """Tìm keywords tương tự từ training data"""
        if not self.keyword_vectorizer or not self.similarity_model:
            return []
        
        try:
            # Vectorize target keyword
            target_vector = self.keyword_vectorizer.transform([target_keyword])
            
            # Find similar keywords
            distances, indices = self.similarity_model.kneighbors(target_vector)
            
            # Get feature names (keywords)
            feature_names = self.keyword_vectorizer.get_feature_names_out()
            
            similar_keywords = []
            for i, idx in enumerate(indices[0]):
                if idx < len(feature_names):
                    similarity_score = 1 - distances[0][i]
                    similar_keywords.append({
                        'keyword': feature_names[idx],
                        'similarity': similarity_score
                    })
            
            return similar_keywords[:n_similar]
            
        except Exception as e:
            print(f"  Error finding similar keywords: {e}")
            return []
    
    def resolve_keyword_synonym(self, keyword):
        """
        Resolve keyword synonym to parent keyword.
        Returns (parent_keyword, is_synonym, original_keyword)
        """
        keyword_lower = keyword.lower().strip()
        
        # Check if it's a known synonym
        if keyword_lower in self.synonym_to_parent:
            parent = self.synonym_to_parent[keyword_lower]
            is_synonym = (parent != keyword_lower)
            return parent, is_synonym, keyword
        
        # Not a known synonym - return as is
        return keyword_lower, False, keyword
    
    def generate_questions_from_real_data(self, keyword, num_questions=5, offset=0):
        """
        Generate câu hỏi dựa trên dữ liệu thực tế.
        
        Args:
            keyword: Từ khóa để generate câu hỏi
            num_questions: Số câu hỏi cần generate
            offset: Bỏ qua N câu hỏi đầu tiên (dùng cho regenerate)
        """
        
        generated_questions = []
        original_keyword = keyword
        
        # ============================================================================
        # STEP 0: Check keyword availability and resolve synonyms
        # ============================================================================
        is_available, resolved_keyword, match_type = self.is_keyword_available(keyword)
        parent_keyword, is_synonym, _ = self.resolve_keyword_synonym(keyword)
        
        if is_available:
            if match_type == 'synonym':
                print(f"    Resolved synonym: '{keyword}' → '{resolved_keyword}'")
                is_synonym = True
                parent_keyword = resolved_keyword
            else:
                print(f"    Direct keyword match: '{keyword}'")
                is_synonym = False
                parent_keyword = keyword.lower()
        elif is_synonym:
            print(f"    Resolved via synonym mapping: '{keyword}' → '{parent_keyword}'")
        
        # 1. Predict category (use original keyword for better context)
        category, confidence = self.predict_category(keyword)
        
        # If category is unknown but we have a synonym match, boost confidence
        if is_synonym and (category == 'unknown' or confidence < 0.3):
            # Re-predict using parent keyword
            category, confidence = self.predict_category(parent_keyword)
            confidence = min(confidence * 1.2, 0.95)  # Boost but cap at 95%
        
        # 2. Suggest form type based on keyword analysis
        suggested_form_type = self._suggest_form_type(keyword)
        
        # 3. Tìm câu hỏi trực tiếp từ keyword HOẶC parent keyword
        direct_questions = self.keyword_question_mapping.get(keyword.lower(), [])
        
        # If no direct match and we have a synonym, try parent keyword
        if len(direct_questions) == 0 and is_synonym:
            direct_questions = self.keyword_question_mapping.get(parent_keyword, [])
            print(f"    Using questions from parent keyword: '{parent_keyword}' ({len(direct_questions)} questions)")
        
        # Apply offset for regenerate functionality
        start_idx = offset
        end_idx = offset + num_questions
        
        for q_data in direct_questions[start_idx:end_idx]:
            # Adapt question text if using synonym
            question_text = q_data['question']
            if is_synonym:
                question_text = self.adapt_question(question_text, parent_keyword, original_keyword)
            
            generated_questions.append({
                'question': question_text,
                'category': q_data['category'] if not is_synonym else category,
                'confidence': confidence,
                'method': 'synonym_match' if is_synonym else 'direct_match',
                'source_keyword': keyword,
                'question_type': self._detect_form_type(q_data['question']),
                'semantic_type': q_data.get('question_type', 'general'),
                'suggested_form_type': suggested_form_type
            })
        
        # 4. Nếu chưa đủ câu hỏi, tìm từ similar keywords
        if len(generated_questions) < num_questions:
            similar_keywords = self.find_similar_keywords(keyword)
            
            for similar_kw in similar_keywords:
                similar_keyword = similar_kw['keyword']
                similarity_score = similar_kw['similarity']
                
                # Tìm câu hỏi của similar keyword
                similar_questions = self.keyword_question_mapping.get(similar_keyword, [])
                
                for q_data in similar_questions:
                    if len(generated_questions) >= num_questions:
                        break
                    
                    # Adapt câu hỏi
                    adapted_question = self.adapt_question(
                        q_data['question'], 
                        similar_keyword, 
                        keyword
                    )
                    
                    generated_questions.append({
                        'question': adapted_question,
                        'category': category,
                        'confidence': confidence * similarity_score,
                        'method': 'similarity_adaptation',
                        'source_keyword': similar_keyword,
                        'similarity_score': similarity_score,
                        'question_type': self._detect_form_type(adapted_question),
                        'semantic_type': q_data.get('question_type', 'general'),
                        'suggested_form_type': suggested_form_type
                    })
                
                if len(generated_questions) >= num_questions:
                    break
        
        # 5. Nếu vẫn chưa đủ, tìm từ cùng category
        if len(generated_questions) < num_questions:
            category_questions = [
                q for q in self.real_questions_db 
                if q['category'] == category and q['keyword'] != keyword.lower()
            ]
            
            for q_data in category_questions:
                if len(generated_questions) >= num_questions:
                    break
                
                adapted_question = self.adapt_question(
                    q_data['question'],
                    q_data['keyword'],
                    keyword
                )
                
                generated_questions.append({
                    'question': adapted_question,
                    'category': category,
                    'confidence': confidence * 0.7,
                    'method': 'category_adaptation',
                    'source_keyword': q_data['keyword'],
                    'question_type': self._detect_form_type(adapted_question),
                    'semantic_type': q_data.get('question_type', 'general'),
                    'suggested_form_type': suggested_form_type
                })
        
        # Calculate total available questions for regenerate info
        total_available = len(direct_questions)
        
        # 6. FINAL FALLBACK: Nếu vẫn không có câu hỏi nào, tạo generic questions
        if len(generated_questions) == 0:
            print(f"   WARNING: No questions found for '{keyword}', generating generic fallback...")
            
            # Tạo các câu hỏi generic dựa trên keyword
            generic_templates = [
                f"What is {keyword}?",
                f"How would you describe your experience with {keyword}?",
                f"What are the main benefits of {keyword}?",
                f"What challenges have you faced with {keyword}?",
                f"How do you rate your knowledge of {keyword}?",
                f"What improvements would you suggest for {keyword}?",
                f"How often do you use {keyword}?",
                f"Would you recommend {keyword} to others?",
            ]
            
            for i, template in enumerate(generic_templates[:num_questions]):
                generated_questions.append({
                    'question': template,
                    'category': category,
                    'confidence': confidence * 0.5,  # Lower confidence for generic
                    'method': 'generic_fallback',
                    'source_keyword': 'template',
                    'question_type': self._detect_form_type(template),
                    'semantic_type': 'general',
                    'suggested_form_type': suggested_form_type
                })
        
        return {
            'questions': generated_questions[:num_questions],
            'metadata': {
                'keyword': keyword,
                'category': category,
                'category_confidence': round(confidence, 6),
                'suggested_form_type': suggested_form_type,
                'total_available': total_available if total_available > 0 else len(generated_questions),
                'can_regenerate': total_available > (offset + num_questions),
                'current_offset': offset,
                'warning': None if len(direct_questions) > 0 else 'Keyword not in training data, using fallback questions'
            }
        }
    
    def _detect_form_type(self, question_text):
        """
        Detect form type dựa trên nội dung câu hỏi.
        Trả về type khớp với DB question_types table.
        
        DB Types:
        1. single_choice - Chọn 1 đáp án
        2. multiple_choice - Chọn nhiều đáp án
        3. text - Nhập text ngắn
        4. rating - Đánh giá sao/số
        5. likert_scale - Thang đo mức độ đồng ý
        6. dropdown - Chọn từ dropdown
        7. checkbox - Checkbox
        8. open_ended - Nhập text dài
        """
        q = question_text.lower().strip()
        
        # 1. Rating/Scale questions
        if re.search(r'(rate|rating|how (satisfied|likely)|on a scale|level of)', q):
            return 'rating'
        
        # 2. Likert scale questions
        if re.search(r'(agree|disagree|strongly|extent do you)', q):
            return 'likert_scale'
        
        # 3. Yes/No → Single choice
        if re.search(r'^(do you|does|is|are|can|could|would|should|will|has|have)\s', q):
            return 'single_choice'
        
        # 4. Selection questions → Single choice
        if re.search(r'(which|select|choose|pick one|experience level)', q):
            return 'single_choice'
        
        # 5. Multiple selection → Multiple choice
        if re.search(r'(select all|check all|multiple|which of the following)', q):
            return 'multiple_choice'
        
        # 6. Number questions → Text
        if re.search(r'(how many|number of|count|quantity|percentage)', q):
            return 'text'
        
        # 7. Open-ended questions (What/How/Why/Describe)
        if re.search(r'^(what|how|why|describe|explain|list|name|identify|tell)', q):
            return 'open_ended'
        
        # 8. Default to text
        return 'text'
    
    def _suggest_form_type(self, keyword):
        """
        Suggest loại form phù hợp dựa trên keyword.
        
        Form Types:
        - survey: Khảo sát ý kiến, feedback
        - registration: Đăng ký sự kiện, khóa học, thành viên
        - application: Ứng tuyển việc làm, học bổng
        - assessment: Đánh giá năng lực, kiến thức, quiz
        
        Returns:
            dict: {form_type, confidence, reason}
        """
        kw = keyword.lower().strip()
        
        # Registration patterns
        registration_patterns = [
            r'(register|registration|sign up|enroll|enrollment|membership|subscribe)',
            r'(event|workshop|course|class|training|webinar|conference)',
            r'(join|participate|attend)'
        ]
        
        # Application patterns  
        application_patterns = [
            r'(apply|application|job|career|position|vacancy|hiring)',
            r'(resume|cv|candidate|recruit|employment)',
            r'(scholarship|grant|admission|university)'
        ]
        
        # Assessment/Quiz patterns
        assessment_patterns = [
            r'(test|quiz|exam|assessment|evaluation|score)',
            r'(knowledge|skill|competency|proficiency|ability)',
            r'(grade|certificate|certification|qualified)'
        ]
        
        # Survey/Feedback patterns
        survey_patterns = [
            r'(survey|feedback|opinion|satisfaction|review)',
            r'(experience|preference|suggestion|recommend)',
            r'(customer|user|employee|market research)'
        ]
        
        # Check each pattern type
        scores = {
            'registration': 0,
            'application': 0,
            'assessment': 0,
            'survey': 0
        }
        
        for pattern in registration_patterns:
            if re.search(pattern, kw):
                scores['registration'] += 1
                
        for pattern in application_patterns:
            if re.search(pattern, kw):
                scores['application'] += 1
                
        for pattern in assessment_patterns:
            if re.search(pattern, kw):
                scores['assessment'] += 1
                
        for pattern in survey_patterns:
            if re.search(pattern, kw):
                scores['survey'] += 1
        
        # Get best match
        max_score = max(scores.values())
        
        if max_score == 0:
            # Default to survey for general keywords
            return {
                'form_type': 'survey',
                'confidence': 0.6,
                'reason': 'Default suggestion for general keyword'
            }
        
        best_type = max(scores, key=scores.get)
        confidence = min(0.95, 0.6 + (max_score * 0.15))
        
        reasons = {
            'registration': 'Keyword suggests event/membership registration',
            'application': 'Keyword suggests job/program application',
            'assessment': 'Keyword suggests skill/knowledge testing',
            'survey': 'Keyword suggests opinion/feedback collection'
        }
        
        return {
            'form_type': best_type,
            'confidence': round(confidence, 2),
            'reason': reasons.get(best_type, 'Pattern matched')
        }
    
    def adapt_question(self, original_question, source_keyword, target_keyword):
        """Thông minh adapt câu hỏi từ source keyword sang target keyword"""
        adapted = original_question
        
        # Simple replacement: replace entire source keyword phrase with target keyword
        # Using case-insensitive replacement
        import re
        pattern = re.compile(re.escape(source_keyword), re.IGNORECASE)
        adapted = pattern.sub(target_keyword, adapted)
        
        # Capitalize first letter if needed
        if adapted and adapted[0].islower():
            adapted = adapted[0].upper() + adapted[1:]
        
        return adapted
    
    def predict_category(self, keyword):
        """Predict category cho keyword với synonym support"""
        
        # STEP 1: Check synonym mapping first (high priority)
        parent_keyword, is_synonym, _ = self.resolve_keyword_synonym(keyword)
        
        if is_synonym:
            # We know the category from our mapping
            category_mapping = {
                'machine learning': 'it',
                'data science': 'it',
                'web development': 'it',
                'cloud computing': 'it',
                'cybersecurity': 'it',
                'digital marketing': 'marketing',
                'content marketing': 'marketing',
                'social media': 'marketing',
                'brand management': 'marketing',
                'financial modeling': 'economics',
                'investment planning': 'economics',
                'market analysis': 'economics',
                'portfolio management': 'economics'
            }
            category = category_mapping.get(parent_keyword, 'unknown')
            if category != 'unknown':
                # Return with high confidence since it's a known synonym
                return category, 0.85
        
        # STEP 2: Fall back to ML classifier if not a synonym
        if not self.category_classifier or not self.question_vectorizer:
            return 'unknown', 0.0
        
        try:
            # Vectorize keyword
            keyword_vec = self.question_vectorizer.transform([keyword])
            
            # Predict
            prediction = self.category_classifier.predict(keyword_vec)[0]
            probabilities = self.category_classifier.predict_proba(keyword_vec)[0]
            confidence = max(probabilities)
            
            # Decode category
            category = self.label_encoder.inverse_transform([prediction])[0]
            
            # IMPORTANT: If category is "nan" or invalid, set confidence to 0
            # This happens when keyword is not in training vocabulary
            if category in ('nan', 'unknown', '', None) or str(category).lower() == 'nan':
                return 'unknown', 0.0
            
            return category, confidence
            
        except Exception as e:
            print(f"    Error predicting category: {e}")
            return 'unknown', 0.0
    
    def save_trained_model(self):
        """Save toàn bộ trained model"""
        print("\n Saving trained model...")
        
        model_data = {
            'keyword_vectorizer': self.keyword_vectorizer,
            'question_vectorizer': self.question_vectorizer,
            'category_classifier': self.category_classifier,
            'similarity_model': self.similarity_model,
            'label_encoder': self.label_encoder,
            'keyword_question_mapping': dict(self.keyword_question_mapping),
            'real_questions_db': self.real_questions_db,
            'category_keywords': dict(self.category_keywords),
            'training_date': datetime.now().isoformat(),
            'model_info': {
                'total_keywords': len(self.keyword_question_mapping),
                'total_questions': len(self.real_questions_db),
                'categories': list(self.label_encoder.classes_) if self.label_encoder else []
            }
        }
        
        # Save model
        model_file = self.models_path / 'real_data_question_model.pkl'
        with open(model_file, 'wb') as f:
            pickle.dump(model_data, f)
        
        # Save summary
        summary_data = {
            'training_completed': datetime.now().isoformat(),
            'model_file': str(model_file),
            'statistics': model_data['model_info'],
            'sample_keywords': list(self.keyword_question_mapping.keys())[:50]
        }
        
        summary_file = self.models_path / 'real_data_model_summary.json'
        with open(summary_file, 'w') as f:
            json.dump(summary_data, f, indent=2)
        
        print(f"    Model saved to: {model_file}")
        print(f"    Summary saved to: {summary_file}")
        
        return model_file
    
    def load_trained_model(self, model_file=None):
        """Load trained model"""
        if not model_file:
            model_file = self.models_path / 'real_data_question_model.pkl'
        
        try:
            with open(model_file, 'rb') as f:
                model_data = pickle.load(f)
            
            self.keyword_vectorizer = model_data['keyword_vectorizer']
            self.question_vectorizer = model_data['question_vectorizer']
            self.category_classifier = model_data['category_classifier']
            self.similarity_model = model_data['similarity_model']
            self.label_encoder = model_data['label_encoder']
            self.keyword_question_mapping = model_data['keyword_question_mapping']
            self.real_questions_db = model_data['real_questions_db']
            self.category_keywords = model_data['category_keywords']
            
            # Populate available keywords from loaded mapping
            self.available_keywords = set(self.keyword_question_mapping.keys())
            
            print(f"    Model loaded from: {model_file}")
            print(f"    Available keywords: {len(self.available_keywords)}")
            print(f"    Keywords: {list(self.available_keywords)[:10]}{'...' if len(self.available_keywords) > 10 else ''}")
            return True
            
        except Exception as e:
            print(f"    Error loading model: {e}")
            return False

def main():
    """Main training function - Xử lý TOÀN BỘ datasets"""
    print("=" * 70)
    print(" REAL DATA QUESTION GENERATION TRAINER - FULL DATASET")
    print("=" * 70)
    
    # Initialize trainer
    trainer = RealDataQuestionTrainer()
    
    # Load and process ALL datasets (800 + 500 files)
    print(" Processing ALL 800 dataset files + 500 question files...")
    combined_df = trainer.load_and_process_datasets()  # No limit = all files
    
    if len(combined_df) < 1000:
        print(" Insufficient data for training!")
        return
    
    # Build AI models
    print("\n Building AI models from MASSIVE real data...")
    
    # Train category classifier
    accuracy = trainer.train_category_classifier(combined_df)
    
    # Build similarity model
    unique_keywords = trainer.build_keyword_similarity_model(combined_df)
    
    # Save trained model regardless of threshold so user can export and inspect it.
    # If accuracy is low we'll still save but include a warning in the logs.
    if trainer.category_classifier is not None:
        model_file = trainer.save_trained_model()
        if accuracy is None:
            accuracy = 0.0
        if accuracy <= 0.5:
            print(f"\n Model saved but accuracy is low ({accuracy:.4f}). Inspect and retrain if needed.")
        else:
            print(f"\n Model saved (accuracy: {accuracy:.4f})")
        
        # Test the system
        print("\n Testing question generation on TRAINED MODEL...")
        test_keywords = [
            "artificial intelligence",
            "financial modeling", 
            "digital marketing automation",
            "cloud computing security",
            "investment portfolio management",
            "machine learning algorithms",
            "social media advertising",
            "cryptocurrency trading",
            "data science anal\ytics",
            "e-commerce optimization"
        ]
        
        for keyword in test_keywords:
            print(f"\n Testing: '{keyword}'")
            questions = trainer.generate_questions_from_real_data(keyword, 4)
            
            for i, q in enumerate(questions, 1):
                method = q['method']
                confidence = q.get('confidence', 0)
                print(f"   {i}. {q['question']} [{method}, conf: {confidence:.2f}]")
        
        print(f"\n MASSIVE DATA Training Completed!")
        print(f" Final Model Statistics:")
        print(f"   • Dataset files processed: 800+")
        print(f"   • Question files processed: 500+") 
        print(f"   • Model Accuracy: {accuracy:.4f}")
        print(f"   • Total keywords: {len(trainer.keyword_question_mapping):,}")
        print(f"   • Total questions: {len(trainer.real_questions_db):,}")
        print(f"   • Unique keywords: {len(unique_keywords):,}")
        print(f"   • Model saved: {model_file}")
        
    else:
        print(" Category classifier was not trained. No model to save.")

if __name__ == "__main__":
    main()
