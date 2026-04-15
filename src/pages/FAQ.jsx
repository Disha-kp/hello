import { useState } from 'react';
import { ChevronDown, ChevronUp, Mail, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FAQ() {
    const navigate = useNavigate();
    const [openIndex, setOpenIndex] = useState(null);

    const faqs = [
        {
            question: "How do I book a ride?",
            answer: "Go to the 'Find Ride' tab, enter your pickup and drop-off locations, and browse available rides. Tap on a ride to view the route map and details, then confirm to book your seat."
        },
        {
            question: "How can I offer a ride?",
            answer: "Navigate to the 'Offer Ride' tab. Fill in your trip details including origin, destination, date, time, and price per seat. Review and publish your ride."
        },
        {
            question: "Is my payment secure?",
            answer: "Yes, all payments are processed securely. You can pay via UPI, Credit/Debit cards, or cash directly to the driver."
        },
        {
            question: "How does the Safety Badge work?",
            answer: "The Safe-Stream badge on the 'Ride Active' screen monitors your trip in real-time. It turns red if a route deviation is detected and allows you to share your live location or call SOS."
        },
        {
            question: "Can I cancel a booked ride?",
            answer: "Yes, you can cancel a ride from the 'My Rides' section. Cancellation charges may apply depending on how close to the departure time you cancel."
        },
        {
            question: "How do I track my ride?",
            answer: "Go to 'Your Rides' and tap 'Track Ride' to see a live route map showing your pickup point, destination, estimated distance, and travel time."
        }
    ];

    const toggleAccordion = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24 relative">
            {/* Header */}
            <div className="bg-[#008080] pt-12 pb-8 px-6 rounded-b-3xl shadow-lg sticky top-0 z-10">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-white/20 p-2 rounded-full text-white hover:bg-white/30 transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Help & Support</h1>
                        <p className="text-teal-100 text-sm">We're here to help you.</p>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">

                {/* Contact Support - Email Only */}
                <div className="flex justify-center">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center space-y-2 hover:shadow-md transition w-full max-w-xs">
                        <div className="bg-teal-50 p-3 rounded-full text-[#008080]">
                            <Mail className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-gray-800 text-sm">Email Us</h3>
                        <p className="text-xs text-gray-500">support@thrivetrip.com</p>
                    </div>
                </div>

                {/* FAQ Section */}
                <div>
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Frequently Asked Questions</h2>
                    <div className="space-y-3">
                        {faqs.map((faq, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                            >
                                <button
                                    onClick={() => toggleAccordion(index)}
                                    className="w-full flex items-center justify-between p-4 text-left"
                                >
                                    <span className="font-medium text-gray-700">{faq.question}</span>
                                    {openIndex === index ? (
                                        <ChevronUp className="w-5 h-5 text-[#008080]" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                    )}
                                </button>
                                {openIndex === index && (
                                    <div className="px-4 pb-4 text-sm text-gray-500 animate-in fade-in slide-in-from-top-1">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
