import React from 'react'
import { motion } from 'framer-motion'

const faqs = [
    {
      question: "Can I change plans later?",
      answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle."
    },
    {
      question: "Is there a free trial available?",
      answer: "We offer a 7-day free trial for the Premium plan, allowing you to explore all premium features before committing."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, PayPal, and bank transfers for Enterprise plans."
    },
    {
      question: "Can I cancel my subscription?",
      answer: "Absolutely, you can cancel your subscription at any time with no cancellation fees."
    }
  ];

function FAQs() {
  return (
              <div className="mb-20">
                <h2 className="text-4xl font-bold text-center mb-10 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">Frequently Asked Questions</h2>
                <div className="max-w-4xl mx-auto bg-gray-800/50 p-10 rounded-2xl shadow-2xl backdrop-blur-md border border-gray-700/50">
                  {faqs.map((faq, index) => (
                    <FAQItem key={index} question={faq.question} answer={faq.answer} />
                  ))}
                </div>
              </div>
  )
}



const FAQItem = ({ question, answer }) => (
  <motion.div
    className="border-b border-gray-700/50 py-6"
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5 }}
  >
    <h3 className="text-xl font-semibold text-white mb-3">{question}</h3>
    <p className="text-gray-300 leading-relaxed">{answer}</p>
  </motion.div>
);


export default FAQs;