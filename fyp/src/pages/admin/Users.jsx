import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Button from '../../components/Button';
import userService from '../../services/userService';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    password: '',
  });

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      const data = await userService.getAllUsers();
      setUsers(data);
      setLoading(false);
    };

    loadUsers();
  }, [refreshKey]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    await userService.createUser(formData);
    setIsModalOpen(false);

    setFormData({
      name: '',
      email: '',
      role: '',
      password: '',
    });

    setRefreshKey(prev => prev + 1);
  };

  const columns = [
    { header: "Name", accessor: "name" },
    { header: "Email", accessor: "email" },
    { 
      header: "Role", 
      render: (row) => (
        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
          {row.role}
        </span>
      )
    },
    { 
      header: "Active",
      render: (row) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          row.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}>
          {row.active ? "Active" : "Inactive"}
        </span>
      )
    }
  ];

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">

        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
            <p className="text-gray-600 mt-1">Manage all system users</p>
          </div>

          <Button onClick={() => setIsModalOpen(true)}>
            + Add User
          </Button>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          {loading ? (
            <div className="text-center p-8 text-gray-500">Loading users...</div>
          ) : (
            <Table columns={columns} data={users} />
          )}
        </div>
      </div>

      {/* ADD USER MODAL */}
      <Modal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New User"
        size="md"
      >
        <form onSubmit={handleAddUser}>
          
          <Input
            label="Full Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <Input
            label="Email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <Select
            label="Role"
            required
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            options={[
              { value: 'student', label: 'Student' },
              { value: 'supervisor', label: 'Supervisor' },
              { value: 'coordinator', label: 'Coordinator' },
              { value: 'internalexaminer', label: 'Internal Examiner' },
              { value: 'externalexaminer', label: 'External Examiner' },
              { value: 'admin', label: 'Admin' },
            ]}
          />

          <Input
            label="Password"
            type="password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />

          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>

            <Button type="submit">
              Create User
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default AdminUsers;
