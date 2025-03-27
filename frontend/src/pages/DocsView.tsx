import React, { useState } from 'react';
import { Search, Code, Terminal, Server, Layers } from 'lucide-react';

interface DocSection {
  id: string;
  category: string;
  title: string;
  content: React.ReactNode;
}

export const DocsView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState('getting-started');

  const docs: DocSection[] = [
    {
      id: "getting-started",
      category: "Guide",
      title: "Getting Started",
      content: (
        <div className="flex flex-col gap-4 text-sm text-graphite leading-relaxed">
          <p>
            Welcome to the <strong>ProjectManagementSoftware (PMS)</strong> Operating System documentation portal. PMS is scaffolded as a high-performance monorepo containing a NestJS API server and a Vite React client.
          </p>
          <h4 className="font-outfit font-bold text-charcoal text-base mt-4">Local Sandbox Setup</h4>
          <p>To run the developer containers and start the code sync services:</p>
          <pre className="bg-background-bone p-4 rounded-xl border border-pastel-lilac/30 font-mono text-xs overflow-x-auto text-charcoal">
{`# 1. Start MongoDB and Redis containers
docker-compose up -d

# 2. Bootstrap workspace dependencies
npm install

# 3. Spin up both clients concurrently
npm run dev`}
          </pre>
          <p>
            The backend starts up on <code className="bg-black/5 px-1 rounded text-xs">http://localhost:3000/api</code> and Swagger docs compile on <code className="bg-black/5 px-1 rounded text-xs">http://localhost:3000/docs</code>. The React client runs on <code className="bg-black/5 px-1 rounded text-xs">http://localhost:5173</code>.
          </p>
        </div>
      )
    },
    {
      id: "frontend-architecture",
      category: "Frontend",
      title: "Frontend Architecture",
      content: (
        <div className="flex flex-col gap-4 text-sm text-graphite leading-relaxed">
          <p>
            The frontend is written in <strong>TypeScript React</strong> and styled with <strong>Tailwind CSS</strong> using custom design tokens matching our pastel-first palette guidelines.
          </p>
          <h4 className="font-outfit font-bold text-charcoal text-base mt-2">Design Tokens</h4>
          <ul className="list-disc pl-5 flex flex-col gap-2">
            <li><strong>Warm Ivory (#F8F5F0)</strong>: Primary application background surface.</li>
            <li><strong>Soft Bone (#F5F1EA)</strong>: Sidebar background surface.</li>
            <li><strong>Pastel Lilac (#CFC5E6)</strong>: High-priority interactions & badge highlights.</li>
            <li><strong>Muted Lavender (#D9D1E8)</strong>: Secondary accents and progress indicators.</li>
          </ul>
          <h4 className="font-outfit font-bold text-charcoal text-base mt-4">Flagship Flow Canvas</h4>
          <p>
            We integrate <strong>React Flow</strong> inside <code className="bg-black/5 px-1.5 py-0.5 rounded font-mono text-xs">DependencyGraph.tsx</code>. It maps task models dynamically. Edges represent dependencies and support drag-and-drop linking.
          </p>
        </div>
      )
    },
    {
      id: "backend-architecture",
      category: "Backend",
      title: "Backend Services",
      content: (
        <div className="flex flex-col gap-4 text-sm text-graphite leading-relaxed">
          <p>
            The backend is a structured <strong>NestJS</strong> server mapping controllers to Mongoose database models.
          </p>
          <h4 className="font-outfit font-bold text-charcoal text-base mt-2">Architecture Highlights</h4>
          <ul className="list-disc pl-5 flex flex-col gap-2">
            <li><strong>Mongoose Schemas</strong>: Users, Orgs, Workspaces, Teams, Projects, Tasks, Comments, and Logs are double-indexed to optimize query speeds.</li>
            <li><strong>Socket.IO Gateway</strong>: Exposes a realtime gateway to sync cursor activity, typing indicators, and board updates.</li>
            <li><strong>BullMQ Background Processing</strong>: Connected to Redis to buffer audit logs and compile heavy reporting statistics asynchronously.</li>
          </ul>
        </div>
      )
    },
    {
      id: "api-reference",
      category: "API",
      title: "API Reference",
      content: (
        <div className="flex flex-col gap-4 text-sm text-graphite leading-relaxed">
          <p>
            The PMS API endpoints are fully typed and decorated for Swagger OpenAPI specification. Key routes include:
          </p>
          <table className="min-w-full border border-pastel-lilac/30 rounded-xl overflow-hidden text-xs text-left">
            <thead className="bg-background-cream text-charcoal font-bold border-b border-pastel-lilac/25">
              <tr>
                <th className="px-4 py-2">Method</th>
                <th className="px-4 py-2">Path</th>
                <th className="px-4 py-2">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-pastel-lilac/15">
                <td className="px-4 py-2 font-mono font-bold text-pastel-lilac">POST</td>
                <td className="px-4 py-2 font-mono">/auth/signup</td>
                <td className="px-4 py-2">Register user and scaffold workspace</td>
              </tr>
              <tr className="border-b border-pastel-lilac/15">
                <td className="px-4 py-2 font-mono font-bold text-pastel-lilac">POST</td>
                <td className="px-4 py-2 font-mono">/auth/signin</td>
                <td className="px-4 py-2">Log in and return JWT tokens</td>
              </tr>
              <tr className="border-b border-pastel-lilac/15">
                <td className="px-4 py-2 font-mono font-bold text-pastel-sage">GET</td>
                <td className="px-4 py-2 font-mono">/workspaces/:id/tasks</td>
                <td className="px-4 py-2">List filtered tasks in workspace</td>
              </tr>
              <tr className="border-b border-pastel-lilac/15">
                <td className="px-4 py-2 font-mono font-bold text-pastel-sage">GET</td>
                <td className="px-4 py-2 font-mono">/tasks/:id</td>
                <td className="px-4 py-2">Get details and dependencies of task</td>
              </tr>
            </tbody>
          </table>
          <p className="text-xs text-slateMuted">
            Review the full Swagger documentation playground at <code className="bg-black/5 px-1 rounded font-mono">http://localhost:3000/docs</code>.
          </p>
        </div>
      )
    }
  ];

  const filteredDocs = docs.filter(
    (d) => 
      d.title.toLowerCase().includes(search.toLowerCase()) || 
      d.category.toLowerCase().includes(search.toLowerCase())
  );

  const activeDoc = docs.find((d) => d.id === activeSection) || docs[0];

  return (
    <div className="flex-1 overflow-hidden flex max-w-6xl w-full mx-auto p-8 gap-8">
      {/* Sidebar navigation */}
      <div className="w-64 shrink-0 flex flex-col gap-6">
        <div className="relative">
          <Search className="w-4 h-4 text-slateMuted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guides..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-pastel-lilac/30 bg-background-cream text-xs focus:outline-none focus:border-pastel-lilac/80"
          />
        </div>

        <div className="flex flex-col gap-1">
          {filteredDocs.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setActiveSection(doc.id)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-smooth ${
                activeSection === doc.id
                  ? 'bg-pastel-lilac/45 text-charcoal'
                  : 'hover:bg-background-bone text-graphite'
              }`}
            >
              {doc.id === 'getting-started' && <Code className="w-4 h-4" />}
              {doc.id === 'frontend-architecture' && <Layers className="w-4 h-4" />}
              {doc.id === 'backend-architecture' && <Server className="w-4 h-4" />}
              {doc.id === 'api-reference' && <Terminal className="w-4 h-4" />}
              <span>{doc.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content panel */}
      <div className="flex-1 glass-panel p-8 rounded-3xl border border-pastel-lilac/25 shadow-sm overflow-y-auto flex flex-col gap-4">
        <div className="border-b border-pastel-lilac/15 pb-4">
          <span className="text-[10px] bg-pastel-lilac text-charcoal font-bold tracking-wider uppercase px-2 py-0.5 rounded">
            {activeDoc.category}
          </span>
          <h2 className="font-outfit text-2xl font-extrabold mt-2 text-charcoal">{activeDoc.title}</h2>
        </div>
        
        {activeDoc.content}
      </div>
    </div>
  );
};
