"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Search, MoreVertical, Shield, ShieldOff, Flag, AlertTriangle } from "lucide-react"
import axios from "axios"
import { useAuth } from "../../contexts/AuthContext"
import { useNavigate } from "react-router-dom"

const FollowerModal = ({ data, isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [dropdownOpen, setDropdownOpen] = useState(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const [reportingUser, setReportingUser] = useState(null)
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)
  const { user } = useAuth()
  const dropdownRef = useRef(null)
  const buttonRefs = useRef({});
  const navigate = useNavigate()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleAction = async (blockEmail, action) => {
    if (action === "block" || action === "unblock") {
      try {
        await axios.post(`${process.env.REACT_APP_API_BASEURL}/api/user/blockEmail`, {
          userEmail: user.email,
          blockEmail,
          block: action === "block",
        })
        console.log("Block response: Success")
      } catch (error) {
        console.error("Error blocking user:", error)
      }
    } else if (action === "report") {
      const follower = filteredFollowers.find((f) => f.email === blockEmail)
      setReportingUser(follower)
      setReportModalOpen(true)
    }
    setDropdownOpen(null)
  }

  const handleReportSubmit = async () => {
    if (!reportReason.trim()) {
      alert("Please provide a reason for reporting this user.")
      return
    }

    setIsSubmittingReport(true)
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_BASEURL}/api/report`, {
        reporterEmail: user.email,
        reportedEmail: reportingUser.email,
        reason: reportReason,
      })
      
      if (response.data.success) {
        alert("Report submitted successfully!")
        setReportModalOpen(false)
        setReportReason("")
        setReportingUser(null)
      } else {
        alert("Failed to submit report. Please try again.")
      }
    } catch (error) {
      console.error("Error submitting report:", error)
      alert("Failed to submit report. Please try again.")
    }
    setIsSubmittingReport(false)
  }

  const handleDropdownToggle = (followerId) => {
    if (dropdownOpen === followerId) {
      setDropdownOpen(null)
      return
    }

    const button = buttonRefs.current[followerId]
    if (button) {
      const rect = button.getBoundingClientRect()
      const dropdownWidth = 192 // w-48 = 12rem = 192px
      const dropdownHeight = 140 // approximate height

      let top = rect.bottom + 8
      let left = rect.right - dropdownWidth

      // Adjust if dropdown would go off screen
      if (left < 8) {
        left = rect.left
      }

      if (top + dropdownHeight > window.innerHeight - 8) {
        top = rect.top - dropdownHeight - 8
      }

      setDropdownPosition({ top, left })
      setDropdownOpen(followerId)
    }
  }

  const filteredFollowers = data.filter((f) => f.fullName.toLowerCase().includes(searchTerm.toLowerCase()))

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative w-full max-w-md bg-white shadow-2xl rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Followers</h2>
              <p className="text-sm text-gray-600 mt-1">{data.length.toLocaleString()} followers</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-full transition-all duration-200"
            >
              <X size={24} />
            </button>
          </div>

          {/* Search */}
          <div className="p-6 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search followers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
              />
            </div>
          </div>

          {/* Followers List */}
          <div className="flex-1 overflow-hidden">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="px-6 pb-6 h-full"
            >
              <div className="space-y-3 max-h-[50vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 pr-2">
                {filteredFollowers.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg font-medium">No followers found</p>
                    <p className="text-gray-400 text-sm mt-1">Try adjusting your search terms</p>
                  </div>
                ) : (
                  filteredFollowers.map((follower, index) => (
                    <motion.div
                      key={follower._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
                    >
                      <div className="flex items-center space-x-4 flex-1 min-w-0" onClick={() => navigate(`/user/${follower._id}`)}>
                        <div className="relative">
                          {follower.photoURL ? (
                            <img
                              src={follower.photoURL || "/placeholder.svg"}
                              alt={follower.fullName}
                              className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-lg shadow-sm">
                              {follower.fullName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate text-lg">{follower.fullName}</h3>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        ref={(el) => (buttonRefs.current[follower._id] = el)}
                        onClick={() => handleDropdownToggle(follower._id)}
                        className="p-2 text-gray-600 hover:text-gray-600 hover:bg-white rounded-lg transition-all duration-200 opacity-100"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Fixed Position Dropdown - Outside Modal */}
        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="fixed w-48 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-[60]"
              style={{
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
              }}
            >
              <button
                onClick={() => {
                  const follower = filteredFollowers.find((f) => f._id === dropdownOpen)
                  if (follower) handleAction(follower.email, "block")
                }}
                className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-600 hover:text-white transition-colors duration-200"
              >
                <ShieldOff className="w-4 h-4 mr-3" />
                Block User
              </button>
              <button
                onClick={() => {
                  const follower = filteredFollowers.find((f) => f._id === dropdownOpen)
                  if (follower) handleAction(follower.email, "unblock")
                }}
                className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-600 hover:text-white transition-colors duration-200"
              >
                <Shield className="w-4 h-4 mr-3" />
                Unblock User
              </button>
              <div className="border-t border-gray-100 my-1"></div>
              <button
                onClick={() => {
                  const follower = filteredFollowers.find((f) => f._id === dropdownOpen)
                  if (follower) handleAction(follower.email, "report")
                }}
                className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-600 hover:text-white transition-colors duration-200"
              >
                <Flag className="w-4 h-4 mr-3 text-orange-500" />
                Report User
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Report Modal */}
        <AnimatePresence>
          {reportModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
              >
                {/* Report Header */}
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-100">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-full">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Report User</h3>
                      <p className="text-sm text-gray-600">Report {reportingUser?.fullName}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setReportModalOpen(false)
                      setReportReason("")
                      setReportingUser(null)
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-full transition-all duration-200"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Report Content */}
                <div className="p-6">
                  <div className="mb-4">
                    <label htmlFor="reportReason" className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for reporting <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="reportReason"
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      placeholder="Please describe why you're reporting this user..."
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-500"
                      rows={4}
                      disabled={isSubmittingReport}
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setReportModalOpen(false)
                        setReportReason("")
                        setReportingUser(null)
                      }}
                      className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors duration-200 font-medium"
                      disabled={isSubmittingReport}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReportSubmit}
                      disabled={isSubmittingReport || !reportReason.trim()}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 font-medium"
                    >
                      {isSubmittingReport ? "Submitting..." : "Submit Report"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}

export default FollowerModal