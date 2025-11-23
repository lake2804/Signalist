# Signalist - Stock Market Application

Signalist is a modern stock market tracking and analysis application built with Next.js, React, and MongoDB. It provides real-time stock data, watchlist functionality, and personalized stock alerts.

## 🚀 Live Demo

Check out the live demo: [Signalist on Vercel](https://signalist-5b4pbxriw-lakesayhis-projects.vercel.app) (Latest Production)

## ✨ Features

- 📈 Real-time stock data visualization
- ⭐ Personalized watchlists
- 🔔 Stock price alerts
- 📱 Responsive design for all devices
- 🌓 Light/Dark mode support
- 🔐 User authentication
- 📧 Email notifications

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **State Management**: React Hook Form
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: Custom auth solution with JWT
- **Deployment**: Vercel
- **UI Components**: Radix UI, Lucide Icons

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0.0 or later
- MongoDB Atlas account or local MongoDB instance
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/lake2804/Signalist.git
   cd Signalist
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root directory and add the following environment variables:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   FINNHUB_API_KEY=your_finnhub_api_key
   EMAIL_SERVER=your_email_server_details
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 📂 Project Structure

```
.
├── app/                    # App router
│   ├── (root)/            # Main application routes
│   ├── api/               # API routes
│   └── auth/              # Authentication pages
├── components/            # Reusable components
├── lib/                   # Utility functions
├── database/              # Database models and connections
├── public/                # Static files
└── styles/                # Global styles
```

## 🔧 Environment Variables

Create a `.env.local` file in the root directory with the following variables:

- `MONGODB_URI`: MongoDB connection string
- `NEXTAUTH_SECRET`: Secret key for NextAuth.js
- `NEXTAUTH_URL`: Base URL of your application
- `FINNHUB_API_KEY`: API key for Finnhub.io
- `EMAIL_SERVER`: Email server configuration

## 🚀 Deployment

The application is deployed on Vercel. To deploy your own instance:

1. Fork this repository
2. Connect to Vercel
3. Add environment variables in Vercel project settings
4. Deploy!

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [MongoDB](https://www.mongodb.com/) for the database
- [Finnhub](https://finnhub.io/) for stock market data
- [Vercel](https://vercel.com/) for deployment
