import {
  ArrowLeft,
  CheckCheck,
  ExternalLink,
  Heart,
  MessageCircleMore,
  MessageSquareMore,
  SendHorizontal,
  Share2,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import SubscriptionModal from "../components/Modals/SubscriptionModal";
import axios from "axios";
import io from "socket.io-client";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

const ProductPage = ({ params }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, updateSubscription, loading } = useAuth(); // Added updateSubscription here
  const queryProduct = location.state?.product;
  const [product, setProduct] = useState();
  const [selectedImage] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const isPremiumUser = ["premium", "standard", "basic"].includes(
    user?.subscription
  );
  const [selectedImageIndex, setselectedImageIndex] = useState();
  const { productId } = useParams();
  const [variableLoaded, setVariableLoaded] = useState(false);
  const [sessionActive, setSessionActive] = useState();
  const [chatBoxOpen, setChatBoxOpen] = useState(false);
  const [chatmessages, setChatMessages] = useState([]);
  const [sessionProduct, setSessionProduct] = useState();
  const [socket, setSocket] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [minimized, setMinimized] = useState(true);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [Quantity, setQuantity] = useState(1);
  
  const endOfMessagesRef = useRef(null);
  const isFetchingRef = useRef(false);

  // Use this function to scroll to the bottom of the chat whenever new messages are added
  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatmessages]);

  const handleStartSession = async () => {
    if (!sessionActive && user) {
      try {
        const response = await axios.post(
          `${process.env.REACT_APP_API_BASEURL}/api/chat/start-session`,
          {
            userId: user?._id || null,
            productId: productId,
          },
          {
            withCredentials: true,
          }
        );
        if (response?.data?.sessionId) {
          setSessionActive(response?.data?.sessionId);
          setChatBoxOpen(true);
          setMinimized(false);
          setSessionProduct(product);
          if (response.status === 201 && socket) {
            socket.emit("newSessionCreated", response?.data?.sessionId);
          }
          return response?.data?.sessionId;
        }
      } catch (error) {
        console.error("Error starting session:", error);
      }
    }
  };

  const sendMessage = async () => {
    // sessionActive || handleStartSession()
    const getid = await handleStartSession();
    const messageData = {
      sessionId: sessionActive || getid,
      sender: "user",
      message: newMessage.trim(),
      // timestamp: new Date().toISOString()
      isReadByUser: true,
    };
    if (messageData.sessionId && messageData.message) {
      // Emit the message to the server
      socket.emit("sendMessage", messageData);
      setNewMessage("");
    }
  };

  useEffect(() => {
    const fetchSessionStatus = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_BASEURL}/api/chat/fetch-session`,
          {
            params: {
              userid: user?._id || null,
            },
            withCredentials: true,
          }
        );
        if (response.data) {
          setSessionActive(response.data?._id);
          setChatBoxOpen(true);
          setChatMessages(response.data?.messages);
          setSessionProduct(response.data?.product);
        }
      } catch (error) {
        console.error("Error fetching session status:", error);
      }
    };
    fetchSessionStatus();
  }, [user]);

  useEffect(() => {
    const socketInstance = io(process.env.REACT_APP_API_BASEURL, {
      withCredentials: true, // Required for cross-origin cookies
    });
    setSocket(socketInstance);

    // Attach to the session room
    if (sessionActive) {
      socketInstance.emit("attachSession", sessionActive);
    }

    // Listen for incoming messages
    socketInstance.on("receiveMessage", (data) => {
      setChatMessages((prevMessages) => [...prevMessages, data]);
    });
    socketInstance.on("adminReadMessage", (messageId) => {
      setChatMessages((prevMessages) => {
        return prevMessages.map((message) => {
          if (message._id === messageId) {
            return { ...message, isReadByAdmin: true };
          }
          return message;
        });
      });
    });

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, [sessionActive]);

  const handleQuery = async () => {
    if (!sessionActive) {
      try {
        if (!newMessage) {
          setNewMessage("I have a query on this product!");
        }
        setTimeout(() => sendMessage(), 1000);
      } catch (error) {}
    }
  };

  const handleDelete = async () => {
    try {
      const response = await axios.post("/api/chat/end", {
        sessionId: sessionActive,
      });
      if (response.status === 200) {
        setChatMessages([]);
        setSessionActive();
        setChatBoxOpen(false);
        setMinimized(true);
      }
    } catch (error) {}
  };

  const handleStartNew = async () => {
    try {
      const response = await axios.post("/api/chat/end", {
        sessionId: sessionActive,
      });
      if (response.status === 200) {
        setChatMessages([]);
      }
    } catch (error) {}
    try {
      try {
        if (!newMessage) {
          setNewMessage("I have a query on different product!");
        }
        const getnewid = async () => {
          try {
            const response = await axios.post(
              `${process.env.REACT_APP_API_BASEURL}/api/chat/start-session`,
              {
                userId: user?._id || null,
                productId: productId,
              },
              {
                withCredentials: true,
              }
            );
            if (response?.data?.sessionId) {
              setSessionActive(response?.data?.sessionId);
              setChatBoxOpen(true);
              setMinimized(false);
              setSessionProduct(product);
              if (response.status === 201 && socket) {
                socket.emit("newSessionCreated", response?.data?.sessionId);
              }
              return response?.data?.sessionId;
            }
          } catch (error) {
            console.error("Error starting session:", error);
          }
        };
        const getid = await getnewid();
        const messageData = {
          sessionId: sessionActive || getid,
          sender: "user",
          message: newMessage.trim() || "I have a query on different product!",
          isReadByUser: true,
        };
        socket.emit("sendMessage", messageData);
        setMinimized(false);
        setChatBoxOpen(true);
        setSessionProduct(product);
        setSessionActive(getid);
      } catch (error) {}
    } catch (error) {}
  };

  useEffect(() => {
    // Check if product is saved when component mounts
    const checkIfSaved = async () => {
      if (user && queryProduct) {
        try {
          const response = await axios.get(
            `${process.env.REACT_APP_API_BASEURL}/api/user/saved-products`,
            { headers: { Authorization: `Bearer ${user.token}` } }
          );
          setIsSaved(
            response.data.products.some((p) => p._id === queryProduct._id)
          );
        } catch (error) {
          console.error("Error checking saved status:", error);
        }
      }
    };
    checkIfSaved();
  }, [user, queryProduct]);

  useEffect(() => {
    const MAX_RETRIES = 3; // Max number of retries
    // const controller = new AbortController();
    // const signal = controller.signal;
    let retryTimeout;

    const getProductData = async (retryAttempt = 0) => {
      if (isFetchingRef.current) return; // Prevent duplicate fetches
      isFetchingRef.current = true; // Mark as fetching

      setVariableLoaded(false); // Start loader
      setProduct(queryProduct);

      if (!user || user.subscription === "free") {
        setVariableLoaded(true); // Stop loader for free users
        isFetchingRef.current = false;
        return;
      }

      try {
        const response = await axios.post(
          `${process.env.REACT_APP_API_BASEURL}/api/user/getproductinfo`,
          { ...queryProduct, productId, email: user.email },
          { withCredentials: true }
        );

        if (response.data) {
          setVariableLoaded(true);
          setProduct(response.data);
        }
      } catch (error) {
        console.error("Error fetching product data:", error);

        if (retryAttempt < MAX_RETRIES) {
          retryTimeout = setTimeout(() => {
            getProductData(retryAttempt + 1);
          }, 1000); // Retry after 1 second
        } else {
          setVariableLoaded(true);
        }
      } finally {
        // Stop loader
        isFetchingRef.current = false;
      }
    };

    getProductData();

    return () => {
      // controller.abort();
      clearTimeout(retryTimeout);
    };
  }, [user, queryProduct, productId]);



  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        {(!user || user.subscription === "free") &&
        !loading &&
        !queryProduct ? (
          <div className="text-red-400">Subscribe to browse products!</div>
        ) : (
          <div className="w-12 h-12 border-4 border-t-[#2ab6e4] border-gray-700 rounded-full animate-spin"></div>
        )}
      </div>
    );
  }

  const handleSaveProduct = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      setSaving(true);
      if (!isSaved) {
        await axios.post("/api/user/saved-products", {
          ...product,
          email: user.email,
        });
        setIsSaved(true);
      } else {
        await axios.delete(`/api/user/saved-products/${product.productId}`, {
          data: { email: user.email },
        });
        setIsSaved(false);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleVisitStore = () => {
    if (!isPremiumUser) {
      setIsSubscriptionModalOpen(true);
      return;
    }
    window.open(product.detailUrl, "_blank");
  };

  const handleSubscribe = async (planName) => {
    try {
      await updateSubscription(planName);
      setIsSubscriptionModalOpen(false);
      // Reload the page to reflect new subscription status
      window.location.reload();
    } catch (error) {
      console.error("Subscription error:", error);
    }
  };

  const getImageUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http") || url.startsWith("/uploads/")) {
      return url;
    }
    if (url.startsWith("//")) {
      return `https:${url}`;
    }
    return url;
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* chatbox */}
      {chatBoxOpen && (
        <div className="fixed right-10 z-20 bottom-10">
          <div className="w-16 relative mb-2">
            {!minimized && (
              <div
                className="w-[340px] md:w-[450px] h-[600px] p-4 bg-[#111827] absolute right-0 bottom-[100%] border border-gray-700 rounded-lg shadow shadow-[#2ab6e4]"
                onMouseLeave={() => setMinimized(true)}
              >
                <div className="h-full w-full bg-[#] ">
                  <div className="h-14 gap-5 pb-4 w-full border-b border-gray-700 flex items-center">
                    {/* <span className='aspect-square'>
                <Crown className='text-gray-400'/>
                </span> */}
                    <span className="flex items-center flex-col text-white">
                      <span className="flex items-center gap-2 text-center">
                        <span className="bg-green-500 w-2 h-2 rounded-full"></span>{" "}
                        Query
                      </span>
                      <span className="text-gray-400 text-xs text-nowrap">
                        session details:
                      </span>
                    </span>
                    <div className="flex items-center gap-3">
                      <img
                        src={sessionProduct?.imageUrl}
                        alt="product"
                        className="h-[40px]"
                      />
                      <p className="text-gray-400 text-ellipsis pb- overflow-hidden text-wrap leading line-clamp-2 text-xs">
                        {sessionProduct?.title}
                      </p>
                    </div>
                    <button
                      className="text-red-500 bg-red-500/10 py-2 px-4 rounded-lg text-xs hover:text-gray-300"
                      onClick={handleDelete}
                    >
                      End
                    </button>
                  </div>
                  <div className="h-[calc(100%-(2*3.5rem))] w-full overflow-y-auto border border-gray-700 ">
                    <div className="flex flex-col p-4 gap-2">
                      {chatmessages.length > 0 &&
                        chatmessages.map((message, index) => (
                          <div
                            className="flex justify-between items-end"
                            key={index}
                          >
                            {message.sender === "admin" && (
                              <span className=" text-gray-700 text-sm">
                                {" "}
                                2:30 am{" "}
                              </span>
                            )}
                            <span className="py-2 px-3 text-wrap bg-[#1F2937] text-white  rounded-lg w-4/5 ">
                              {message.message}
                            </span>
                            {message.sender === "user" && (
                              <span className=" text-gray-700 text-xs flex flex-col">
                                <span>
                                  {new Date(message.timestamp).toLocaleString(
                                    [],
                                    {
                                      // weekday: 'short',
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    }
                                  )}{" "}
                                </span>
                                <span className="flex gap-1 items-end">
                                  {new Date(
                                    message.timestamp
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })}{" "}
                                  <CheckCheck
                                    size={14}
                                    className={`${
                                      message.isReadByAdmin
                                        ? "text-[#2ab6e4]"
                                        : ""
                                    }`}
                                  />
                                </span>
                              </span>
                            )}
                          </div>
                        ))}
                      <div ref={endOfMessagesRef} />
                    </div>
                  </div>
                  <div className="h-14 bg- w-full border border-gray-700 rounded-b-lg flex items-center">
                    <input className="hidden" type="file" accept="image/*" />
                    {sessionProduct.productId !== product.productId && (
                      <span
                        className="h-full aspect-square text-[#2ab6e4] hover:text-[#a017c9] transition-colors flex flex-nowrap text-nowrap px-4 items-center justify-center cursor-pointer"
                        onClick={handleStartNew}
                      >
                        Start New
                      </span>
                    )}
                    <input
                      className="w-full h-full text-white px-3 bg-inherit border-l border-gray-700 outline-none"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          sendMessage();
                        }
                      }}
                    />
                    <span
                      className="h-full aspect-square bg-[#] text-[#2ab6e4] hover:text-[#a017c9] transition-colors flex items-center justify-center cursor-pointer"
                      onClick={sendMessage}
                    >
                      <SendHorizontal />
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div
            className="  rounded-full aspect-square bg-green-500 text-white flex items-center justify-center cursor-pointer"
            onClick={() => setMinimized(!minimized)}
          >
            <MessageSquareMore size={40} />
          </div>
        </div>
      )}

      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container px-4 py-4 mx-auto">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-300 transition-colors hover:text-white"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </motion.button>
        </div>
      </header>

      <div className="container px-4 py-8 mx-auto">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div className="relative overflow-hidden bg-gray-800 aspect-square rounded-2xl">
              <motion.img
                key={selectedImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                src={
                  !selectedImageIndex
                    ? getImageUrl(product.imageUrl)
                    : product.images[selectedImageIndex]
                }
                alt={product.title}
                className="object-cover w-full h-full"
              />
            </div>
          </motion.div>

          {/* Details Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <span className="px-3 py-1 text-sm font-medium text-white rounded-full bg-gradient-to-r from-[#a017c9] to-[#2ab6e4]">
                    {product.category}
                  </span>
                  <span className="px-3 py-1 text-sm font-medium text-white rounded-full bg-gradient-to-r from-[#a017c9] to-[#2ab6e4]">
                    {product.subcategory}
                  </span>
                </div>
              </div>

              <h1 className="mb-4 text-2xl font-bold text-white">
                {product.title}
              </h1>

              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold bg-gradient-to-r from-[#a017c9] to-[#2ab6e4] bg-clip-text text-transparent">
                  ${(product.price * 1.3).toFixed(2)}
                </p>
                {/* Only show seller info for premium users */}
                {false && (
                  <div className="text-right">
                    <p className="mb-1 text-sm text-gray-400">Seller:</p>
                    <p className="font-medium text-white">{product.seller}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Only show shop ID for premium users */}
            {false && (
              <div className="pt-6 space-y-4 border-t border-gray-700">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <h4 className="mb-1 text-sm font-medium text-gray-400">
                      Shop ID
                    </h4>
                    <p className="text-white">{product.shopId}</p>
                  </div>
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <h4 className="mb-1 text-sm font-medium text-gray-400">
                      Created At
                    </h4>
                    <p className="text-white">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {isPremiumUser && (
              <div className="pt-6 space-y-4 border-t border-gray-700 w-full">
                {!variableLoaded &&
                  !(
                    product?.images?.length > 0 ||
                    product?.colors?.length > 0 ||
                    product?.sizes?.length > 0
                  ) && (
                    <div className="p-4 bg-gray-800 rounded-lg flex flex-wrap gap-5 w-full ">
                      <div className="flex items-center justify-center w-full rounded-lg py-6 bg-gray-900">
                        <div className="w-12 h-12 border-4 border-t-[#2ab6e4] border-gray-700 rounded-full animate-spin"></div>
                      </div>
                    </div>
                  )}

                {product?.images?.length > 0 && (
                  <div className="p-4 bg-gray-800 rounded-lg flex flex-wrap gap-5">
                    {product?.images.map((image, index) => (
                      <img
                        key={index}
                        src={getImageUrl(image)}
                        alt={product.title}
                        className={`w-24 ${
                          index === selectedImageIndex ||
                          (index === 0 && !selectedImageIndex)
                            ? "border-4 border-[#2ab6e4]"
                            : ""
                        } rounded-lg cursor-pointer`}
                        onClick={() => setselectedImageIndex(index)}
                      />
                    ))}
                  </div>
                )}
                {product?.colors?.length > 0 && (
                  <div className="p-4 bg-gray-800 rounded-lg flex flex-wrap gap-5">
                    {product?.colors.map((colors, index) => (
                      <p
                        key={index}
                        className={`py-3 px-5 cursor-pointer text-white rounded-lg font-medium ${
                          selectedColor !== colors?.split("9918").join("")
                            ? "bg-[#111827]"
                            : "bg-gradient-to-r from-[#a017c9] to-[#2ab6e4]"
                        } ${colors?.split("9918").join("") === "" && "hidden"}`}
                        onClick={() => {
                          setSelectedColor(colors?.split("9918").join(""));
                          if (!sessionActive) {
                            setNewMessage(
                              `I have a query about this product. ${
                                product?.colors?.length > 0
                                  ? `Color: ${colors?.split("9918").join("")}`
                                  : ""
                              } ${
                                product?.sizes?.length > 0
                                  ? `Size: ${selectedSize || "Not selected"}`
                                  : ""
                              } Quantity: ${Quantity}`
                            );
                          }
                        }}
                      >
                        {colors?.split("9918").join("")}
                      </p>
                    ))}
                  </div>
                )}
                {product?.sizes?.length > 0 && (
                  <div className="p-4 bg-gray-800 rounded-lg flex flex-wrap gap-5">
                    {product?.sizes.map((sizes, index) => (
                      <p
                        key={index}
                        className={`py-3 px-5 cursor-pointer text-white rounded-lg font-medium ${
                          selectedSize !== sizes
                            ? "bg-[#111827]"
                            : "bg-gradient-to-r from-[#a017c9] to-[#2ab6e4]"
                        }`}
                        onClick={() => {
                          setSelectedSize(sizes);
                          if (!sessionActive) {
                            setNewMessage(
                              `I have a query about this product. ${
                                product?.colors?.length > 0
                                  ? `Color: ${selectedColor || "Not selected"}`
                                  : ""
                              } ${
                                product?.sizes?.length > 0
                                  ? `Size: ${sizes}`
                                  : ""
                              } Quantity: ${Quantity}`
                            );
                          }
                        }}
                      >
                        {sizes}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="pt-6 space-y-4">
              {user?.subscription !== "free" && (
                <div className="max-w-full flex flex-wrap gap-3">
                  {product.subcategory !== "undefined" &&
                    product.category !== "undefined" && (
                      <motion.button
                        onClick={handleQuery}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full sm:w-auto py-3 px-4 bg-gradient-to-r from-[#a017c9] to-[#2ab6e4] text-white rounded-lg font-medium flex items-center justify-center space-x-2 hover:opacity-90 transition-opacity text-nowrap"
                        style={{ opacity: sessionActive ? 0.5 : 1 }}
                      >
                        <MessageCircleMore className="w-5 h-5" />
                        <span>
                          {sessionActive ? "Query running" : "Send a query"}
                        </span>
                      </motion.button>
                    )}

                  {product?.colors?.length > 0 && (
                    <span className="w-full sm:w-auto px-5 bg-[#111827] text-white rounded-lg border border-gray-700 text-center text-nowrap flex items-center justify-between">
                      Color:{" "}
                      <span className="text-gray-400 px-1">
                        {selectedColor || "Choose"}
                      </span>
                    </span>
                  )}

                  {product?.sizes?.length > 0 && (
                    <span className="w-full sm:w-auto py-3 px-5 bg-[#111827] text-white rounded-lg border border-gray-700 text-center text-nowrap flex items-center justify-between">
                      Size:{" "}
                      <span className="text-gray-400 px-1">
                        {selectedSize || "Choose"}
                      </span>
                    </span>
                  )}
                  <input
                    type="number"
                    min={1}
                    placeholder="Quantity"
                    value={Quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full sm:w-auto px-5 py-3 bg-[#111827] text-white rounded-lg border border-gray-700"
                  />
                </div>
              )}

              {product.subcategory === "undefined" &&
              product.category === "undefined" ? (
                <motion.button
                  onClick={handleQuery}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-full py-3 px-4 bg-gradient-to-r from-[#a017c9] to-[#2ab6e4] text-white rounded-lg font-medium flex items-center justify-center space-x-2 hover:opacity-90 transition-opacity text-nowrap"
                  style={{ opacity: sessionActive ? 0.5 : 1 }}
                >
                  <MessageCircleMore className="w-5 h-5" />
                  <span>
                    {sessionActive ? "Query running" : "Send a query"}
                  </span>
                </motion.button>
              ) : (
                <motion.button
                  onClick={handleVisitStore}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 px-4 bg-gradient-to-r from-[#a017c9] to-[#2ab6e4] text-white rounded-lg font-medium flex items-center justify-center space-x-2 hover:opacity-90 transition-opacity"
                >
                  <ExternalLink className="w-5 h-5" />
                  <span>
                    {isPremiumUser
                      ? "Contact Vendor"
                      : "Subscribe to Contact Vendor"}
                  </span>
                </motion.button>
              )}
              {isPremiumUser && (
                <div className="flex space-x-4">
                  <motion.button
                    onClick={handleSaveProduct}
                    disabled={saving}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center justify-center flex-1 px-4 py-3 space-x-2 font-medium text-white transition-colors rounded-lg ${
                      isSaved
                        ? "bg-[#2ab6e4] hover:bg-[#2ab6e4]/90"
                        : "bg-gray-800 hover:bg-gray-700"
                    }`}
                  >
                    <Heart
                      className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`}
                    />
                    <span>
                      {saving ? "Saving..." : isSaved ? "Saved" : "Save"}
                    </span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center flex-1 px-4 py-3 space-x-2 font-medium text-white transition-colors bg-gray-800 rounded-lg hover:bg-gray-700"
                  >
                    <Share2 className="w-5 h-5" />
                    <span>Share</span>
                  </motion.button>
                </div>
              )}
            </div>

            {/* Status indicator */}
            <div className="pt-6 border-t border-gray-700">
              <div className="inline-flex items-center px-3 py-1 text-green-500 rounded-full bg-green-500/10">
                <span className="w-2 h-2 mr-2 bg-green-500 rounded-full"></span>
                Active Product
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        onSubscribe={handleSubscribe}
      />
    </div>
  );
};

export default ProductPage;
