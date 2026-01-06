import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
            <h1 className="text-9xl font-bold text-gray-200">404</h1>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">页面未找到</h2>
                <p className="text-gray-600 mb-8">抱歉，您访问的页面不存在。</p>
                <Link
                    to="/"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
                >
                    返回首页
                </Link>
            </div>
        </div>
    );
};

export default NotFound;
