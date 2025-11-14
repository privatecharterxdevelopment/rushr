import React, { useState } from 'react';
import Header from '../components/Header';

export default function HomePage() {
  const [service, setService] = useState('');
  const [zip, setZip] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Service:', service, 'ZIP:', zip);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <main className="bg-gradient-to-br from-teal-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div>
              <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
                Hire the right pro<br />
                without the hassle
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Post your job once. Compare quotes, photos, and availability in one place. Message pros directly and book fast.
              </p>
              
              {/* Search Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Describe what you need done..."
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                  <button 
                    type="submit"
                    className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors"
                  >
                    Get bids
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {['Household jobs', 'Appliance', 'Pest control', 'Yard cleanup', 'Junk removal', 'Yard work'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setService(tag)}
                      className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </form>
            </div>
            
            {/* Right Column - Dashboard Preview */}
            <div className="relative">
              <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Quote comparison</h3>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-emerald-600 rounded-full"></div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <QuoteCard 
                    name="Pro name"
                    rating="★★★★★ 4.9 (127)"
                    price="$150"
                    availability="Available today"
                    selected={true}
                  />
                  <QuoteCard 
                    name="Pro name"
                    rating="★★★★☆ 4.2 (89)"
                    price="$180"
                    availability="Tomorrow 2-4"
                  />
                  <QuoteCard 
                    name="Pro name"
                    rating="★★★★☆ 4.6 (156)"
                    price="$200"
                    availability="Sat 10-12"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Stats Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StatCard number="1200+" label="Jobs completed" />
            <StatCard number="12" label="Average bids per job" />
            <StatCard number="3" label="Average time to hire (hours)" />
          </div>
        </div>
      </section>

      {/* Popular Emergencies Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Popular emergencies</h2>
            <p className="text-gray-600">Pick a category and get matched fast, see all emergencies →</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <CategoryCard name="Plumbing" icon="🔧" />
            <CategoryCard name="Electrical" icon="⚡" />
            <CategoryCard name="HVAC" icon="❄️" />
            <CategoryCard name="Roof leak" icon="🏠" />
            <CategoryCard name="Water damage" icon="💧" />
            <CategoryCard name="Locksmith" icon="🔐" />
            <CategoryCard name="Appliance repair" icon="🔧" />
            <CategoryCard name="Handyman" icon="🔨" />
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How it works</h2>
            <p className="text-gray-600">Simple fast and straightforward for everyone</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard 
              icon="📝"
              title="Request help"
              description="Describe the emergency you need help with. Add a quick photo and your availability."
            />
            <StepCard 
              icon="💬"
              title="Approve estimates"
              description="Review bids from interested and available pros. Approve quotes and book."
            />
            <StepCard 
              icon="✅"
              title="Verified from a pro"
              description="Book against verified and available pros. Message securely."
            />
          </div>
        </div>
      </section>

      {/* Or call and book you Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Or call and book you</h2>
            <p className="text-gray-600">Save time, collect from emergency call-outs</p>
          </div>
          
          <div className="flex justify-center flex-wrap gap-4 text-sm text-gray-500">
            {['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ', 'Philadelphia, PA', 'San Antonio, TX'].map((city) => (
              <span key={city}>{city}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Featured pros Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Featured pros</h2>
            <a href="#" className="text-emerald-600 hover:text-emerald-700">Browse all →</a>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ProCard 
              name="Javier Plumbing"
              rating="★★★★★"
              service="Plumbing • Emergency • Water heater"
              price="$75/hr"
              color="bg-emerald-600"
            />
            <ProCard 
              name="All Pro Roofing"
              rating="★★★★★"
              service="Roofing • Emergency • Leak repair"
              price="$95/hr"
              color="bg-blue-600"
            />
            <ProCard 
              name="Residential Electric"
              rating="★★★★★"
              service="Electrical • Emergency • Panel upgrade"
              price="$85/hr"
              color="bg-purple-600"
            />
            <ProCard 
              name="Premium Handyman"
              rating="★★★★★"
              service="Handyman • Emergency • General repair"
              price="$65/hr"
              color="bg-orange-600"
            />
          </div>
        </div>
      </section>

      {/* Trust & Safety Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Trust & Safety</h2>
            <p className="text-gray-600">Built for homeowners and contractors</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-semibold mb-6 flex items-center">
                <span className="text-emerald-600 mr-2">🛡️</span>
                Safety
              </h3>
              <ul className="space-y-3">
                {[
                  'Personal safety about',
                  'Discrimination policy',
                  'Background checks',
                  'Dispute resolution for money'
                ].map((item) => (
                  <li key={item} className="flex items-start">
                    <span className="text-emerald-600 mr-2">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-6 flex items-center">
                <span className="text-emerald-600 mr-2">👥</span>
                Others
              </h3>
              <ul className="space-y-3">
                {[
                  'Users need to verify',
                  'Customer service line',
                  'Fraud monitoring',
                  'Dispute and issue help'
                ].map((item) => (
                  <li key={item} className="flex items-start">
                    <span className="text-emerald-600 mr-2">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <p className="text-gray-600">
              Learn more about our <a href="#" className="text-emerald-600 hover:text-emerald-700 underline">trust policies</a>
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Homeowners who got it done</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TestimonialCard 
              rating="★★★★★"
              quote="I had an emergency fix needed. Best roof matching."
              author="—David, Customer"
            />
            <TestimonialCard 
              rating="★★★★★"
              quote="Got help with a quick toilet and setup. 7 days"
              author="—Lisa C, Brooklyn"
            />
            <TestimonialCard 
              rating="★★★★★"
              quote="I had an urgent need day. They had from 4 days"
              author="—Sarah J, Manhattan"
            />
          </div>
        </div>
      </section>

      {/* Need help right now Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Need help right now?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Book an on-call pro with a clear hourly rate and time-verified billing.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium text-lg transition-colors">
              Book now
            </button>
            <button className="px-8 py-3 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 font-medium text-lg transition-colors">
              How it works
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo and Description */}
            <div className="md:col-span-1">
              <div className="flex items-center mb-4">
                <img src="/rushr.png" alt="Rushr" className="h-8 w-auto" />
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Linking Homeowners with Local Pros Instantly. Post a job, get bids, hire with confidence.
              </p>
              <p className="text-xs text-gray-500">© 2025 Rushr • Made for homeowners & contractors</p>
            </div>
            
            {/* Company */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                {['About', 'Pricing', 'Dashboard', 'Rushr for Homeowners', 'Rushr For Pros'].map((item) => (
                  <li key={item}><a href="#" className="hover:text-gray-900 transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
            
            {/* Explore */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Explore</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                {[
                  'Home', 'How It Works', 'How it Works For Pros', 'Rushr Teams', 
                  'Search For A Pro', 'Browse Jobs', 'Post a Job', 'Signals'
                ].map((item) => (
                  <li key={item}><a href="#" className="hover:text-gray-900 transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
            
            {/* Legal & Contact */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Legal & Contact</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900 transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Contact</a></li>
                <li><a href="mailto:hello@usehousecall.com" className="hover:text-gray-900 transition-colors">hello@usehousecall.com</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Component helpers
function QuoteCard({ name, rating, price, availability, selected = false }: {
  name: string;
  rating: string;
  price: string;
  availability: string;
  selected?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${
      selected 
        ? 'bg-emerald-50 border-emerald-200' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          selected ? 'bg-emerald-600' : 'bg-gray-400'
        }`}>
          {selected && <span className="text-white text-xs">✓</span>}
        </div>
        <div>
          <div className="font-medium text-sm">{name}</div>
          <div className="text-xs text-gray-500">{rating}</div>
        </div>
      </div>
      <div className="text-right">
        <div className={`font-bold ${selected ? 'text-emerald-600' : 'text-gray-900'}`}>{price}</div>
        <div className="text-xs text-gray-500">{availability}</div>
      </div>
    </div>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-4xl font-bold text-emerald-600 mb-2">{number}</div>
      <div className="text-gray-600">{label}</div>
    </div>
  );
}

function CategoryCard({ name, icon }: { name: string; icon: string }) {
  return (
    <div className="bg-white p-4 rounded-lg text-center hover:shadow-md transition-shadow cursor-pointer">
      <div className="w-12 h-12 bg-emerald-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
        <span className="text-emerald-600 text-xl">{icon}</span>
      </div>
      <div className="text-sm font-medium">{name}</div>
    </div>
  );
}

function StepCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-emerald-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
        <span className="text-2xl">{icon}</span>
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function ProCard({ name, rating, service, price, color }: {
  name: string;
  rating: string;
  service: string;
  price: string;
  color: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <div className={`w-12 h-12 ${color} rounded-full mr-3`}></div>
        <div>
          <h3 className="font-semibold">{name}</h3>
          <div className="text-yellow-400">{rating}</div>
        </div>
      </div>
      <p className="text-gray-600 text-sm mb-4">{service}</p>
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">Starting at</span>
        <span className="font-bold">{price}</span>
      </div>
    </div>
  );
}

function TestimonialCard({ rating, quote, author }: { rating: string; quote: string; author: string }) {
  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <div className="text-yellow-400 mb-4">{rating}</div>
      <p className="text-gray-700 mb-4">"{quote}"</p>
      <p className="text-sm text-gray-500">{author}</p>
    </div>
  );
}