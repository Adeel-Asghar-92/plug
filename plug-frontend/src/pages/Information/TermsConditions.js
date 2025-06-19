import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TermsConditions = () => {
  const [activeSection, setActiveSection] = useState(null);
  const navigate = useNavigate();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: 'beforeChildren',
        staggerChildren: 0.05,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0, opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24,
      },
    },
  };

  // Terms and conditions sections with full content from the docx
  const sections = [
    {
      id: 'introduction',
      title: 'Introduction',
      content: `Welcome to ValueVault.ai, an AI-powered platform based in Dallas, Texas, specializing in the valuation of high-value assets. These Terms of Service ("Terms") govern your access to and use of the ValueVault.ai platform, including its website, valuation tools, and marketplace features (collectively, the "Service"). By accessing or using the Service, you agree to be bound by these Terms. If you do not agree, you may not use the Service.`
    },
    {
      id: 'eligibility',
      title: 'Eligibility',
      content: `To use the Service, you must be at least 18 years old and capable of entering into a legally binding agreement. You represent that all information you provide is accurate and that you have the legal authority to use the Service and engage in transactions facilitated by it.`
    },
    {
      id: 'scope',
      title: 'Scope of Service',
      subsections: [
        {
          subtitle: 'Valuation Services',
          items: [
            'ValueVault.ai provides AI-driven valuation estimates for high-value assets based on user-submitted data, market trends, historical sales, and behavioral patterns. These valuations are intended as informational guides, not certified appraisals or guarantees of value.',
            'The Service analyzes inputs such as asset specifications (e.g., make, model, condition), supporting documentation (e.g., photos, certificates), and market data to generate estimates.'
          ]
        },
        {
          subtitle: 'Marketplace Functionality',
          items: [
            'The Service includes a marketplace where users can list assets for sale, browse available items, and connect with potential buyers or sellers. Transactions are facilitated but not directly executed by ValueVault.ai.'
          ]
        }
      ]
    },
    {
      id: 'responsibilities',
      title: 'User Responsibilities',
      subsections: [
        {
          subtitle: 'Accurate Information',
          items: [
            'You agree to provide complete, accurate, and up-to-date information when submitting asset details, creating listings, or engaging with the Service. Inaccurate or misleading data may result in unreliable valuations or transaction disputes.',
            'You are responsible for verifying the authenticity and ownership of any asset you submit or list.'
          ]
        },
        {
          subtitle: 'Compliance with Laws',
          items: [
            'You must ensure that your use of the Service complies with all applicable local, state, national, and international laws, including those related to taxes, ownership transfers, and export/import regulations.',
            'Any illegal activity, such as listing stolen goods or engaging in fraudulent transactions, is strictly prohibited.'
          ]
        },
        {
          subtitle: 'Account Security',
          items: [
            'You are responsible for maintaining the confidentiality of your account credentials (e.g., username, password) and for all activities conducted under your account.',
            'Notify us immediately if you suspect unauthorized access or a security breach.'
          ]
        }
      ]
    },
    {
      id: 'limitations',
      title: 'Valuation Limitations',
      subsections: [
        {
          subtitle: 'Estimate-Based Nature',
          items: [
            'Valuations provided by ValueVault.ai are educated guesses derived from proprietary AI analysis of market trends, historical data, and user inputs. They are not definitive or binding assessments of an asset&apos;s worth.',
            'Market conditions, asset uniqueness, and other variables may cause actual sale prices to differ from our estimates.'
          ]
        },
        {
          subtitle: 'No Liability for Losses',
          items: [
            'ValueVault.ai is not responsible for any financial losses, damages, or missed opportunities resulting from your use of the Service, including reliance on valuation estimates or participation in marketplace transactions.',
            'You assume all risks associated with decisions made based on the Service.'
          ]
        },
        {
          subtitle: 'Advisory Role Only',
          items: [
            'Valuation estimates are provided for informational purposes and should not be the sole basis for purchasing, selling, or otherwise transacting an asset. We strongly recommend consulting independent appraisers, financial advisors, or legal experts before making decisions.'
          ]
        }
      ]
    },
    {
      id: 'transactions',
      title: 'Marketplace Transactions',
      subsections: [
        {
          subtitle: 'Structure',
          items: [
            'A Ten percent commission, calculated as a percentage of the total value of an asset, is charged upon the successful completion of a sale facilitated through the marketplace. This fee applies to assets referred to buyers or sellers via the Service, regardless of which party initiates the transaction.',
            'The commission rate will be disclosed during the listing or transaction process and must be agreed to before finalizing a sale. Payment is due upon confirmation of the transaction.'
          ]
        },
        {
          subtitle: 'User Agreements',
          items: [
            'Transactions between buyers and sellers are governed by the terms negotiated between those parties. ValueVault.ai acts solely as a facilitator and is not a party to the sale contract.',
            'You are responsible for resolving disputes, fulfilling payment obligations, and ensuring delivery or transfer of assets as agreed with your transaction counterpart.'
          ]
        },
        {
          subtitle: 'Listing Guidelines',
          items: [
            'Listings must accurately represent the asset, including its condition, ownership status, and any material defects. Misrepresentation may result in removal of the listing and suspension of your account.',
            'ValueVault.ai reserves the right to reject or remove listings that violate these Terms or applicable laws.'
          ]
        }
      ]
    },
    {
      id: 'fees',
      title: 'Fees and Payments',
      content: [
        'In addition to the marketplace commission, certain features of the Service (e.g., premium valuation reports or enhanced listing options) may incur additional fees. These will be clearly disclosed prior to your use of such features.',
        'All payments must be made through approved methods provided by the Service. You are responsible for any taxes or additional costs associated with your transactions.'
      ]
    },
    {
      id: 'intellectual',
      title: 'Intellectual Property',
      subsections: [
        {
          subtitle: 'Ownership',
          items: [
            'The Service, including its AI algorithms, valuation models, software, design, and branding, is the intellectual property of ValueVault.ai and protected by copyright, trademark, and other laws.',
            'You may not copy, modify, distribute, or reverse-engineer any part of the Service without our prior written consent.'
          ]
        },
        {
          subtitle: 'User Content',
          items: [
            'By submitting asset data, photos, or other content to the Service, you grant ValueVault.ai a non-exclusive, worldwide, royalty-free license to use, store, and display that content as necessary to provide the Service (e.g., generating valuations or creating marketplace listings).',
            'You retain ownership of your content and represent that you have the right to submit it.'
          ]
        }
      ]
    },
    {
      id: 'prohibited',
      title: 'Prohibited Conduct',
      content: [
        'Using the Service for illegal purposes, such as fraud, money laundering, or trafficking prohibited items.',
        'Attempting to hack, disrupt, or overload the Service, including through malware, bots, or unauthorized access.',
        'Submitting false or misleading information to manipulate valuations or deceive other users.',
        'Harassing, threatening, or impersonating other users or entities.'
      ]
    },
    {
      id: 'termination',
      title: 'Termination',
      subsections: [
        {
          subtitle: 'By You',
          items: [
            'You may stop using the Service at any time by discontinuing access or requesting account deletion through our support channels.'
          ]
        },
        {
          subtitle: 'By ValueVault.ai',
          items: [
            'We may suspend or terminate your access to the Service, with or without notice, if you violate these Terms, engage in prohibited conduct, or if we deem it necessary to protect the Service or other users.',
            'Upon termination, your right to use the Service ends, but obligations related to completed transactions (e.g., commission payments) remain enforceable.'
          ]
        }
      ]
    },
    {
      id: 'disclaimers',
      title: 'Disclaimers',
      content: [
        'The Service is provided "as is" and "as available," without warranties of any kind, express or implied, including accuracy, reliability, or fitness for a particular purpose.',
        'We do not guarantee uninterrupted access to the Service or that it will be free of errors, delays, or security breaches.'
      ]
    },
    {
      id: 'liability',
      title: 'Limitation of Liability',
      content: [
        'To the fullest extent permitted by law, ValueVault.ai, its affiliates, and its partners shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from your use of the Service, including but not limited to losses from transactions, reliance on valuations, or service interruptions.',
        'This limitation applies even if we have been advised of the possibility of such damages.'
      ]
    },
    {
      id: 'indemnification',
      title: 'Indemnification',
      content: [
        'You agree to indemnify and hold ValueVault.ai, its affiliates, and their respective officers, directors, and agents harmless from any claims, damages, or expenses (including legal fees) arising from your use of the Service, violation of these Terms, or infringement of third-party rights.'
      ]
    },
    {
      id: 'governing',
      title: 'Governing Law and Dispute Resolution',
      content: [
        'These Terms are governed by the laws of the State of Texas, without regard to conflict of law principles.',
        'Any disputes arising from your use of the Service shall be resolved through binding arbitration in Dallas, Texas, under the rules of the American Arbitration Association, except that either party may seek injunctive relief in a court of competent jurisdiction for matters involving intellectual property or equitable claims.'
      ]
    },
    {
      id: 'changes',
      title: 'Changes to These Terms',
      content: [
        'We may update these Terms periodically to reflect changes in the Service, legal requirements, or operational practices. The updated version will be posted on our website with a revised effective date.',
        'Continued use of the Service after changes take effect constitutes your acceptance of the revised Terms. Significant updates will be communicated via email or in-platform notifications.'
      ]
    },
    {
      id: 'contact',
      title: 'Contact Us',
      content: [
        'For questions, concerns, or support related to these Terms or the Service, please contact us at:',
        'Email: contact@valuevault.ai',
        'Address: ValueVault.ai, 539 W. Commerce St Suite 6614, Dallas TX 75208 United States',
        'We aim to respond to inquiries within a reasonable timeframe, typically within 30 days.'
      ]
    },
    {
      id: 'entire',
      title: 'Entire Agreement',
      content: [
        'These Terms, along with our Privacy Policy, constitute the entire agreement between you and ValueVault.ai regarding your use of the Service, superseding any prior agreements or understandings.'
      ]
    },
    {
      id: 'acknowledgment',
      title: 'Acknowledgment',
      content: [
        'By accessing or using ValueVault.ai, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. We are committed to providing a valuable tool for high-value asset valuation and transactions, and your adherence to these Terms ensures a fair and effective experience for all users.'
      ]
    }
  ];

  // Handle section toggle and scrolling
  const handleSectionToggle = (sectionId) => {
    setActiveSection(activeSection === sectionId ? null : sectionId);
    
    // Scroll to section
    if (activeSection !== sectionId) {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 text-white">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="container relative z-10 px-4 py-16 mx-auto max-w-7xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-12"
        >
          {/* Back button */}
          <motion.div variants={itemVariants}>
            <button
              onClick={() => navigate('/')}
              className="flex items-center mb-4 text-gray-300 hover:text-white transition-colors duration-300"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Back to Home
            </button>
          </motion.div>

          {/* Header Section with enhanced styling */}
          <motion.section variants={itemVariants} className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Terms of Service</h1>
                <div className="absolute -bottom-4 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full"></div>
              </div>
            </div>
            <p className="text-xl text-gray-300 mt-8">
              <span className="font-medium">ValueVault.ai</span> • <span className="text-gray-400">Effective Date: March 15, 2025</span>
            </p>
            <p className="mt-6 max-w-2xl mx-auto text-gray-300 leading-relaxed">
              These Terms of Service establish the guidelines for using our platform. Please read them carefully to understand your rights and responsibilities.
            </p>
          </motion.section>

          {/* Main content with sidebar navigation */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Sidebar Navigation */}
            <motion.aside 
              variants={itemVariants}
              className="lg:w-1/4 lg:sticky lg:top-8 lg:self-start h-screen overflow-auto"
            >
              <div className="p-6 rounded-xl backdrop-blur-md bg-gray-900/30 border border-gray-700/50 shadow-xl">
                <h2 className="text-2xl font-bold mb-4 text-white">Quick Navigation</h2>
                <div className="flex flex-col space-y-2">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => handleSectionToggle(section.id)}
                      className={`text-left p-3 rounded-lg transition-all duration-300 ${
                        activeSection === section.id 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                          : 'bg-gray-800/50 hover:bg-gray-700/70 text-gray-300'
                      }`}
                    >
                      {section.title}
                    </button>
                  ))}
                </div>
              </div>
            </motion.aside>

            {/* Main Content - Each section with enhanced styling */}
            <div className="lg:w-3/4 space-y-24">
              {sections.map((section, index) => (
                <motion.section
                  key={section.id}
                  id={section.id}
                  variants={itemVariants}
                  className="relative p-6 sm:p-8 rounded-2xl backdrop-blur-md bg-black/20 shadow-xl border border-gray-800 overflow-hidden"
                >
                  {/* Decorative section number */}
                  <div className="absolute -top-6 -left-6 text-9xl font-bold text-gray-700/10">
                    {index + 1}
                  </div>
                  
                  <div className="relative z-10">
                    <h2 className="text-3xl font-bold mb-8 inline-block text-white">
                      <span className="relative">
                        {section.title}
                        <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></span>
                      </span>
                    </h2>

                    {/* Display content based on section structure */}
                    {section.content && !Array.isArray(section.content) && (
                      <p className="text-gray-300 leading-relaxed mb-6 text-lg">{section.content}</p>
                    )}
                    
                    {section.content && Array.isArray(section.content) && (
                      <div className="space-y-4">
                        {section.content.map((paragraph, idx) => (
                          <p key={idx} className="text-gray-300 leading-relaxed">{paragraph}</p>
                        ))}
                      </div>
                    )}
                    
                    {section.subsections && (
                      <div className="space-y-8 mt-6">
                        {section.subsections.map((subsection, idx) => (
                          <div key={idx} className="bg-gray-800/30 rounded-xl p-6 border-l-4 border-blue-500">
                            <h3 className="text-xl font-semibold mb-4 text-blue-300">{subsection.subtitle}</h3>
                            <ul className="space-y-3">
                              {subsection.items.map((item, itemIdx) => (
                                <li key={itemIdx} className="flex items-start">
                                  <span className="text-blue-400 mr-2 mt-1">•</span>
                                  <span className="text-gray-300">{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.section>
              ))}
              
              {/* Final call-to-action and contact section */}
              <motion.section 
                variants={itemVariants} 
                className="mt-20 p-8 sm:p-10 rounded-2xl bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-gray-700/50 text-center"
              >
                <h2 className="text-3xl font-bold mb-6 text-white">Questions About Our Terms?</h2>
                <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                  We&apos;re here to help you understand our terms of service. If you have any questions or need clarification,
                  please don&apos;t hesitate to reach out.
                </p>
                
                <div className="inline-flex items-center justify-center space-x-4 mb-8">
                  <a 
                    href="mailto:contact@valuevault.ai" 
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-300 flex items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                    Email Us
                  </a>
                  <div className="text-gray-300">
                    <div className="font-medium">539 W. Commerce St Suite 6614</div> 
                    <div>Dallas TX 75208, United States</div>
                  </div>
                </div>
                
                <p className="text-gray-400 italic text-sm">
                  By using ValueVault.ai, you acknowledge that you have read and understood these Terms of Service and agree to be bound by them.
                </p>
              </motion.section>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsConditions;