import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedClass, setSelectedClass] = useState('Class 10A');

  const mockStats = {
    averageScore: 82,
    studentsCompleted: 28,
    totalStudents: 30,
    performanceImprovement: 12,
    studentProgress: -5
  };

  const classes = ['Class 10A', 'Class 10B', 'Class 11A', 'Class 11B', 'Class 12A', 'Class 12B'];

  const handleLogout = () => {
    navigate('/login');
  };

  const handleScheduleExam = () => {
    alert('Schedule Exam functionality would be implemented here');
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between whitespace-nowrap border-b border-subtle-light dark:border-subtle-dark px-10 py-3">
        <div className="flex items-center gap-4">
          <div className="text-primary size-6">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" fill="currentColor"></path>
            </svg>
          </div>
          <h2 className="text-lg font-bold tracking-tight">EduAssess</h2>
        </div>
        
        <nav className="hidden items-center gap-8 md:flex">
          <Link 
            to="/admin" 
            className={`text-sm font-medium hover:text-primary ${location.pathname === '/admin' ? 'text-primary' : 'text-muted-light dark:text-muted-dark'}`}
          >
            Dashboard
          </Link>
          <Link 
            to="/exams" 
            className="text-sm font-medium text-muted-light dark:text-muted-dark hover:text-primary"
          >
            Exams
          </Link>
          <button className="text-sm font-medium text-muted-light dark:text-muted-dark hover:text-primary">
            Students
          </button>
          <button className="text-sm font-medium text-muted-light dark:text-muted-dark hover:text-primary">
            Reports
          </button>
        </nav>
        
        <div className="flex items-center gap-4">
          <button className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-subtle-light dark:bg-subtle-dark text-muted-light dark:text-muted-dark hover:bg-primary/20 dark:hover:bg-primary/30 hover:text-primary">
            <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
              <path d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z"></path>
            </svg>
          </button>
          <div className="size-10 rounded-full bg-cover bg-center bg-no-repeat" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDpyaIw6Q6AexkQI-WH-8v1m4hBaUQaUOd3KOnou_q9UeKePQVtVJ1SNNjczC5nQrIpM4MPUUe4OaH-0XHjrpHpzXj3ga2RycU-PWTODmQ2mGwJwlgaCD4nX7cZtQeIlC3x9Q4g1hfhWZd_OEiSQx0P39c4-OhTSagXMoeQ-x2j0tdR5v1r7XK3wzQYgtZmZa43GNLMon6Lf4m5L1Tf_Aya2guUh93QXhusaPLugLlPyn-ho0jFvhsnajXFYfH5bVlETyCWqDQXKno")'}}></div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-80 border-r border-subtle-light dark:border-subtle-dark py-5">
          <h3 className="px-4 pb-2 pt-4 text-lg font-bold tracking-tight">Classes</h3>
          <nav className="flex flex-col">
            {classes.map((className) => (
              <button
                key={className}
                onClick={() => setSelectedClass(className)}
                className={`flex items-center justify-between gap-4 px-4 py-3 text-base font-medium rounded-lg cursor-pointer transition-colors w-full text-left ${
                  selectedClass === className
                    ? 'bg-primary/10 dark:bg-primary/20 text-primary'
                    : 'text-muted-light dark:text-muted-dark hover:bg-subtle-light dark:hover:bg-subtle-dark hover:text-foreground-light dark:hover:text-foreground-dark'
                }`}
              >
                <span className="flex-1 truncate">{className}</span>
                <svg className="shrink-0" fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
                  <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>
                </svg>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="flex flex-col gap-8">
            {/* Header Section */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight">{selectedClass} Dashboard</h1>
                <p className="text-muted-light dark:text-muted-dark">Overview of {selectedClass}'s performance in monthly exams.</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-subtle-light dark:border-subtle-dark text-muted-light dark:text-muted-dark hover:bg-subtle-light dark:hover:bg-subtle-dark">
                  <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
                    <path d="M224,152v56a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V152a8,8,0,0,1,16,0v56H208V152a8,8,0,0,1,16,0Zm-101.66,5.66a8,8,0,0,0,11.32,0l40-40a8,8,0,0,0-11.32-11.32L136,132.69V40a8,8,0,0,0-16,0v92.69L93.66,106.34a8,8,0,0,0-11.32,11.32Z"></path>
                  </svg>
                </button>
                <Button
                  onClick={handleScheduleExam}
                  icon={<span>+</span>}
                >
                  Schedule Exam
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card>
                <div className="flex flex-col gap-2">
                  <p className="text-base font-medium text-muted-light dark:text-muted-dark">Average Score</p>
                  <p className="text-4xl font-bold tracking-tight">{mockStats.averageScore}%</p>
                </div>
              </Card>
              <Card>
                <div className="flex flex-col gap-2">
                  <p className="text-base font-medium text-muted-light dark:text-muted-dark">Students Completed</p>
                  <p className="text-4xl font-bold tracking-tight">{mockStats.studentsCompleted}/{mockStats.totalStudents}</p>
                </div>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Exam Performance Chart */}
              <Card>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-base font-medium">Exam Performance</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold tracking-tight">+{mockStats.performanceImprovement}%</p>
                      <p className="text-sm font-medium text-accent-positive">+{mockStats.performanceImprovement}% vs Last Month</p>
                    </div>
                  </div>
                  <div className="grid h-[200px] grid-flow-col items-end justify-items-center gap-6 px-3">
                    <div className="w-full rounded-t bg-subtle-light dark:bg-subtle-dark" style={{height: '70%'}}></div>
                    <div className="w-full rounded-t bg-subtle-light dark:bg-subtle-dark" style={{height: '85%'}}></div>
                    <div className="w-full rounded-t bg-subtle-light dark:bg-subtle-dark" style={{height: '50%'}}></div>
                    <div className="w-full rounded-t bg-subtle-light dark:bg-subtle-dark" style={{height: '80%'}}></div>
                    <div className="w-full rounded-t bg-subtle-light dark:bg-subtle-dark" style={{height: '60%'}}></div>
                    <div className="w-full rounded-t bg-primary" style={{height: '92%'}}></div>
                  </div>
                  <div className="grid grid-cols-6 gap-6 text-center">
                    <p className="text-xs font-bold uppercase text-muted-light dark:text-muted-dark">Exam 1</p>
                    <p className="text-xs font-bold uppercase text-muted-light dark:text-muted-dark">Exam 2</p>
                    <p className="text-xs font-bold uppercase text-muted-light dark:text-muted-dark">Exam 3</p>
                    <p className="text-xs font-bold uppercase text-muted-light dark:text-muted-dark">Exam 4</p>
                    <p className="text-xs font-bold uppercase text-muted-light dark:text-muted-dark">Exam 5</p>
                    <p className="text-xs font-bold uppercase text-muted-light dark:text-muted-dark">Exam 6</p>
                  </div>
                </div>
              </Card>

              {/* Student Progress Chart */}
              <Card>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-base font-medium">Student Progress</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold tracking-tight">{mockStats.studentProgress}%</p>
                      <p className="text-sm font-medium text-accent-negative">{mockStats.studentProgress}% vs Last Month</p>
                    </div>
                  </div>
                  <div className="flex h-[200px] flex-1 flex-col gap-8 py-4">
                    <svg fill="none" height="100%" preserveAspectRatio="none" viewBox="-3 0 478 150" width="100%" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_chart" x1="236" x2="236" y1="1" y2="149">
                          <stop stopColor="#13a4ec" stopOpacity="0.2"></stop>
                          <stop offset="1" stopColor="#13a4ec" stopOpacity="0"></stop>
                        </linearGradient>
                      </defs>
                      <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25V149H0V109Z" fill="url(#paint0_linear_chart)"></path>
                      <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25" stroke="#13a4ec" strokeLinecap="round" strokeWidth="3"></path>
                    </svg>
                  </div>
                  <div className="grid grid-cols-6 gap-6 text-center">
                    <p className="text-xs font-bold uppercase text-muted-light dark:text-muted-dark">Week 1</p>
                    <p className="text-xs font-bold uppercase text-muted-light dark:text-muted-dark">Week 2</p>
                    <p className="text-xs font-bold uppercase text-muted-light dark:text-muted-dark">Week 3</p>
                    <p className="text-xs font-bold uppercase text-muted-light dark:text-muted-dark">Week 4</p>
                    <p className="text-xs font-bold uppercase text-muted-light dark:text-muted-dark">Week 5</p>
                    <p className="text-xs font-bold uppercase text-muted-light dark:text-muted-dark">Week 6</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="secondary" icon={<span>📊</span>}>View Reports</Button>
                <Button variant="secondary" icon={<span>👥</span>}>Manage Students</Button>
                <Button variant="secondary" icon={<span>📝</span>}>Create Exam</Button>
                <Button variant="secondary" icon={<span>📧</span>}>Send Notifications</Button>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
