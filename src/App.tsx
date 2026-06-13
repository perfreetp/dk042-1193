import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import Dashboard from '@/pages/Dashboard';
import ContractWorkbench from '@/pages/ContractWorkbench';
import ProcessDesigner from '@/pages/ProcessDesigner';
import ApprovalDetail from '@/pages/ApprovalDetail';
import TemplateCenter from '@/pages/TemplateCenter';
import ArchiveSearch from '@/pages/ArchiveSearch';
import Statistics from '@/pages/Statistics';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/workbench" element={<ContractWorkbench />} />
          <Route path="/designer" element={<ProcessDesigner />} />
          <Route path="/templates" element={<TemplateCenter />} />
          <Route path="/archive" element={<ArchiveSearch />} />
          <Route path="/analytics" element={<Statistics />} />
          <Route path="/approval/:id" element={<ApprovalDetail />} />
        </Route>
      </Routes>
    </Router>
  );
}
