import React, { useState, useEffect,useRef } from 'react';
import {  AlertCircle, SendHorizontal,Image,CircleX,Eye,Calendar } from 'lucide-react';
import { data } from 'react-router-dom';
import axios from 'axios';
import io from "socket.io-client";
import { useAuth } from '../../contexts/AuthContext';

const SupportChatting = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionActive, setSessionActive] = useState();
  const [chatmessages, setChatMessages] = useState([]);
  const [socket, setSocket] = useState(null); 
  const [newMessage, setNewMessage] = useState('');
  const [Sessions, setSessions] = useState([]);
  const endOfMessagesRef = useRef(null); 
  const endOfPageRef = useRef(null); 
  const [producStickOnTop, setProductStickOnTop] = useState(true);
//   const [SearchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

 


  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth',
      });
  };

  useEffect(() => {
    scrollToBottom();
    
  }, [chatmessages]); 

  useEffect(() => {
      setTimeout(() => {
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth',
          });
      }, 1500);
    //   }
  }, []); 



  



  useEffect(() => {
    if(!user) return;
    const fetchData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_BASEURL}/api/chat/all-sessions`, {
          params: { email: process.env.REACT_APP_ADMIN_EMAIL }
        });
        if(response.data){
            console.log(user);
            setSessions(response.data.filter(session => session.user.email === user.email));
            setSessionActive(response.data[0]?._id);
            setChatMessages(response.data.find(session => session._id === response.data[0]?._id)?.messages || [])
            try {
                await axios.get(`${process.env.REACT_APP_API_BASEURL}/api/chat/seen`, {
                    params: {
                      sessionId: response.data[0]?._id
                    },
                    withCredentials: true
                  })
            } catch (error) {
                
            }
            
        }
        setLoading(false);
      } catch (error) {
        setError(error);
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);
  



 const SelectACtiveSession = async(sessionId) => {
    setSessionActive(sessionId);
      setChatMessages(Sessions.find(session => session._id === sessionId)?.messages || [])
      setSessions((prevSessions) =>
        prevSessions.map((session) =>
          session._id === sessionId
            ? {
                ...session,
                messages: session.messages.map((message) => ({
                  ...message,
                  isReadByAdmin: true
                })),
              }
            : session
        )
      );
      Sessions.find(session => session._id === sessionId)?.messages?.forEach((message) => {
        if (message.isReadByAdmin) return;
        socket.emit("adminReadsMessage", sessionId, message._id);
    });
    try {
        await axios.get(`${process.env.REACT_APP_API_BASEURL}/api/chat/seen`, {
          params: {
            sessionId: sessionId
          },
          withCredentials: true
        })
    } catch (error) {
        
    }

  }


  useEffect(() => {
    const socketInstance = io(process.env.REACT_APP_API_BASEURL, {
      withCredentials: true,
    });
    setSocket(socketInstance);
  
    // Attach to all session rooms
    Sessions.forEach((session) => {
      socketInstance.emit("attachSession", session._id);
    });
  
    socketInstance.on("receiveMessage", (data) => {
      // Update chat messages only for the active session
      if (sessionActive === data.sessionId) {
        setChatMessages((prevMessages) => [
          ...prevMessages,
          { ...data, isReadByAdmin: true },
        ]);
        socketInstance.emit("adminReadsMessage", data.sessionId, data._id);
      }
  
      // Update sessions with the new message
      setSessions((prevSessions) =>
        prevSessions.map((session) =>
          session._id === data.sessionId
            ? {
                ...session,
                messages: [
                  ...session.messages,
                  {
                    ...data,
                    isReadByAdmin: sessionActive === data.sessionId,
                  },
                ],
              }
            : session
        )
      );
    });

  socketInstance.on("userReadMessage", ({ sessionId, messageId }) => {
    setSessions((prevSessions) =>
      prevSessions.map((session) =>
        session._id === sessionId
          ? {
              ...session,
              messages: session.messages.map((message) =>
                message._id === messageId
                  ? { ...message, isReadByUser: true }
                  : message
              ),
            }
          : session
      )
    );
    setChatMessages((prevMessages) => [
          ...prevMessages,
          { ...data, isReadByUser: true },
        ]);
      

  });

  socketInstance.on("new-session-started", async(session) => {
    try {
        setSessions((prevSessions) => [...prevSessions, session]);
    } catch (error) {
        
    }
  });
  
    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, [Sessions, sessionActive]);
  


  const sendMessage = async() => {
    const messageData = {
      sessionId: sessionActive ,
      sender: 'user',
      message: newMessage.trim(),
      isReadByAdmin : true
    };
    
    if (messageData.sessionId && messageData.message) {
      socket.emit("sendMessage", messageData);
      setNewMessage("");
    }
  };



const handleDelete = async () => {
    try {
        const response = await axios.post('/api/chat/end', {
            sessionId: sessionActive
        })
        if(response.status === 200){
            setSessions((prevSessions) => prevSessions.filter((session) => session._id !== sessionActive))
            const newsession = Sessions.filter((session) => session._id !== sessionActive)[0]
            SelectACtiveSession(newsession?._id)
        }
    } catch (error) {
        
    }
}


  if (loading || error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-[#2ab6e4]"></div>
      </div>
    );
  }

  return (
    <div className="container px-4 mx-auto">
      {false && (
        <div className="p-4 mb-4 text-red-500 bg-red-100 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{'error'}</span>
          </div>
        </div>
      )}

        <div className='w-full h-full max-h-[calc(100vh-20px)] overflow-hidden p-4 bg-[#111827] border border-gray-700 rounded-lg shadow shadow-[#2ab6e4] flex relative'>
       
            <div className='absolute min-h-screen border-l border-gray-700 top-0 left-[23%]'></div>
            <div className='h-full w-[30%] pr-3 '>
            <div className='h-14 gap-5 pb-4 w-full border-b border-gray-700 flex items-center'>
                {/* <input
                className='bg-gray-700 text-white py-2 px-4 mr-4 rounded-lg w-full'
                placeholder='Search by name'
                 onChange={(e) => setSearchTerm(e.target.value)}
                 onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      sendMessage();
                    }
                  }}
                /> */}
                <span className='text-center text-xl text-white py-2 px-4 mr-4 rounded-lg w-full'>
                    Dates
                </span>
            </div>
            <div className='w-full h-[calc(100vh-90px)] overflow-y-auto flex-col pr-4
             py-2 ' >
                {Sessions?.length > 0 ? Sessions.filter((session) => session?.user?.fullName?.toLowerCase().includes('')).map((session, index) => (
                    <div className={`flex justify-between items-end mb-2 cursor-pointer rounded-lg border ${session?._id !== sessionActive ? ' border-gray-700 bg-inherit':'border-[#1F2937] bg-[#1F2937]'}`} key={index}
                    onClick={() => SelectACtiveSession(session?._id)}
                    >    
                    <span className='py-2 px-3 text-wrap bg-[#] text-white rounded-lg w-full flex items-center gap-2'>
                       <Calendar/> 
                       <span>{
                            session
                                ?.startedAt
                                ? `${new Date(session
                                    ?.startedAt).toLocaleDateString()} at ${new Date(session
                                        ?.startedAt).toLocaleTimeString()}`
                                : 'No start time available'
                            }

                       </span>
                    </span>
                    </div>
                )):<span className='text-gray-400 w-full text-center flex justify-center'>No messages</span>}

            </div>
            </div>
        <div className='h-full w-full flex flex-col '>
            <div className='h-14 gap-5 pb-4 w-full border-b border-gray-700 flex items-center justify-between'>
            {/* <span className='aspect-square'>
            <Crown className='text-gray-400'/>
            </span> */}
            <div className='flex items-center text-white gap-10'>
                <Calendar/>
                <span>{
                    Sessions?.find((session) => session?._id === sessionActive)
                        ?.startedAt
                        ? `${new Date(Sessions.find((session) => session?._id === sessionActive).startedAt).toLocaleDateString()} at ${new Date(Sessions.find((session) => session?._id === sessionActive).startedAt).toLocaleTimeString()}`
                        : 'No start time available'
                    }
                    </span>
            </div>
            
            <div className='flex gap-5'>
            {!producStickOnTop && <button className='text-green-500 h-max bg-green-500/10 p-2 rounded-full text-xs hover:text-gray-300' onClick={() => setProductStickOnTop(true)}>
                        <Eye size={16}/>
                    </button>}
                    {sessionActive && (
                  <span className={`pr-5 pt-1 ${Sessions?.find((session) => session?._id === sessionActive)?.status === 'active' ? 'text-green-500' : 'text-red-500'}`}>
                    {Sessions?.find((session) => session?._id === sessionActive)?.status}
                  </span>
                )}

            {sessionActive && Sessions?.find((session) => session?._id === sessionActive)?.status === 'active' && <button className='text-red-500 bg-red-500/10 py-2 px-4 rounded-lg text-xs hover:text-gray-300' onClick={() => handleDelete(sessionActive)}>
                End
            </button>}
            </div>
            </div>
            <div className='h-[80vh] w-full overflow-y-auto border border-gray-700'>
            <div className='flex flex-col p-4 gap-2 relative'>
                {sessionActive && <div title='Query Product' className={`w-full flex gap-5 border-b border-gray-700 mb-3 ${producStickOnTop && 'sticky top-0 bg-[#111827] pt-4'}`}>
                    <img
                     src={Sessions?.find((session) => session?._id === sessionActive)?.product?.imageUrl ?? ''}
                     alt={Sessions?.find((session) => session?._id === sessionActive)?.product?.title ?? 'Product image'}
                     className='h-24'
                    />
                    <div className='flex flex-col gap-2 pb-1'>
                    <p className='text-gray-400 text-ellipsis overflow-hidden text-wrap leading line-clamp-2 text-sm cursor-pointer' title='Product title truncated'>
                    <span className='text-white'>Title </span> : {Sessions?.find((session) => session?._id === sessionActive)?.product?.title ?? 'No title available'}
                    </p>
                    <p className='text-gray-400 text-ellipsis overflow-hidden text-wrap leading line-clamp-2 text-xs cursor-pointer' title='Product ID'>
                       <span className='text-white'>Product ID </span> : {Sessions?.find((session) => session?._id === sessionActive)?.product?.productId ?? 'No description available'}
                    </p>
                    <button className='text-green-500 bg-green-500/10 py-2 px-4 rounded-lg text-xs hover:text-gray-300' title='Visit Product'
                    onClick={() => window.location.href = Sessions?.find((session) => session?._id === sessionActive)?.product?.detailUrl}
                    >
                        Visit Product
                    </button>

                    </div>
                   {producStickOnTop && <button className='text-red-500 h-max bg-red-500/10 p-2 rounded-full text-xs hover:text-gray-300' onClick={() => setProductStickOnTop(false)}>
                        <CircleX size={16}/>
                    </button>}
                </div>}
                {chatmessages?.length > 0 &&
                chatmessages.map((message, index) => (
                    <div className='w-full flex justify-between items-end' key={index}>
                    {message?.sender === 'admin' && (<span className='text-gray-700 text-xs flex flex-col'>
                        <span>
                            {new Date(message?.timestamp ?? Date.now()).toLocaleString([], {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            })}
                        </span>
                        {new Date(message?.timestamp ?? Date.now()).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                        })}
                        </span>
                    )}
                     <div useRef={endOfPageRef} className='hidden'/>
                    <span className='py-2 px-3 text-wrap bg-[#1F2937] text-white rounded-lg w-4/5'>
                        {message?.message ?? 'No message content'}
                    </span>
                    {message?.sender === 'user' && (
                        <span className='text-gray-700 text-xs flex flex-col'>
                        <span>
                            {new Date(message?.timestamp ?? Date.now()).toLocaleString([], {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            })}
                        </span>
                        {new Date(message?.timestamp ?? Date.now()).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                        })}
                        </span>
                    )}
                    </div>
                ))}
                <div ref={endOfMessagesRef} />
            </div>
            </div>
            {Sessions?.find((session) => session?._id === sessionActive)?.status === 'active' &&<div className='h-14 bg- w-full border border-gray-700 rounded-b-lg flex items-center'>
            <input
                className='hidden'
                type='file'
                accept='image/*'
            />
            <span className='h-full aspect-square text-[#2ab6e4] hover:text-[#a017c9] transition-colors  items-center justify-center cursor-pointer hidden'>
                <Image />
                
            </span>
            <input
                className='w-full h-full text-white px-3 bg-inherit border-l border-gray-700 outline-none'
                value={newMessage ?? ''}
                onChange={(e) => setNewMessage(e.target.value)}
            />
            <span
                className='h-full aspect-square bg-[#] text-[#2ab6e4] hover:text-[#a017c9] transition-colors flex items-center justify-center cursor-pointer'
                onClick={sendMessage}
            >
                <SendHorizontal />
            </span>
            </div>}
            
        </div>
        </div>
        
       
    
    </div>
  );
};

export default SupportChatting;