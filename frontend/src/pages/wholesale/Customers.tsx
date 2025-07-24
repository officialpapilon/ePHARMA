import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2, Save, X } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  type: string;
  contactPerson: string;
  dateAdded: string;
}

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [newCustomer, setNewCustomer] = useState<
    Omit<Customer, 'id' | 'dateAdded'>
  >({
    name: '',
    phone: '',
    email: '',
    address: '',
    type: 'Pharmacy',
    contactPerson: '',
  });

  // Mock data
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: '1',
      name: 'MediCare Hospital',
      phone: '123-456-7890',
      email: 'info@medicare.com',
      address: '123 Hospital Ave, Medical City, MC 12345',
      type: 'Hospital',
      contactPerson: 'Dr. John Williams',
      dateAdded: '2024-10-15',
    },
    {
      id: '2',
      name: 'City Clinic',
      phone: '234-567-8901',
      email: 'contact@cityclinic.com',
      address: '456 Health St, Wellness Town, WT 23456',
      type: 'Clinic',
      contactPerson: 'Dr. Sarah Johnson',
      dateAdded: '2024-11-20',
    },
    {
      id: '3',
      name: 'HealthPlus Pharmacy',
      phone: '345-678-9012',
      email: 'orders@healthplus.com',
      address: '789 Pharmacy Rd, Medicine Valley, MV 34567',
      type: 'Pharmacy',
      contactPerson: 'Michael Brown',
      dateAdded: '2024-12-05',
    },
    {
      id: '4',
      name: 'Wellness Center',
      phone: '456-789-0123',
      email: 'wellness@center.com',
      address: '321 Wellness Blvd, Healthy Heights, HH 45678',
      type: 'Clinic',
      contactPerson: 'Emily Davis',
      dateAdded: '2025-01-10',
    },
    {
      id: '5',
      name: 'Community Health',
      phone: '567-890-1234',
      email: 'community@health.org',
      address: '654 Community Way, Care City, CC 56789',
      type: 'Non-profit',
      contactPerson: 'Robert Wilson',
      dateAdded: '2025-02-15',
    },
  ]);

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCustomer = () => {
    const id = (customers.length + 1).toString();
    const dateAdded = new Date().toISOString().split('T')[0];

    setCustomers([...customers, { id, dateAdded, ...newCustomer }]);

    setNewCustomer({
      name: '',
      phone: '',
      email: '',
      address: '',
      type: 'Pharmacy',
      contactPerson: '',
    });

    setIsAddModalOpen(false);
  };

  const handleEditCustomer = () => {
    if (selectedCustomer) {
      setCustomers(
        customers.map((customer) =>
          customer.id === selectedCustomer.id ? selectedCustomer : customer
        )
      );
      setIsEditModalOpen(false);
      setSelectedCustomer(null);
    }
  };

  const handleDeleteCustomer = () => {
    if (selectedCustomer) {
      setCustomers(
        customers.filter((customer) => customer.id !== selectedCustomer.id)
      );
      setIsDeleteModalOpen(false);
      setSelectedCustomer(null);
    }
  };

  const handleNewCustomerChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setNewCustomer({
      ...newCustomer,
      [name]: value,
    });
  };

  const handleSelectedCustomerChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    if (selectedCustomer) {
      const { name, value } = e.target;
      setSelectedCustomer({
        ...selectedCustomer,
        [name]: value,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Customer Management</h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full md:w-96">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search customers..."
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-indigo-500 focus:border-indigo-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Customers Table */}
      <div className="border rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Contact
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Contact Person
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Date Added
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {customer.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {customer.address}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {customer.phone}
                      </div>
                      <div className="text-sm text-gray-500">
                        {customer.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                        {customer.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.contactPerson}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(customer.dateAdded).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2 justify-end">
                        <button
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setIsEditModalOpen(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setIsDeleteModalOpen(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No customers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Add New Customer</h3>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={newCustomer.name}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Enter customer name"
                  required
                  autoFocus
                  onChange={handleNewCustomerChange}
                />
              </div>
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700"
                >
                  Phone
                </label>
                <input
                  type="text"
                  name="phone"
                  id="phone"
                  value={newCustomer.phone}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Enter phone number"
                  required
                  pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
                  title="Please enter a valid phone number (123-456-7890)"
                  onChange={handleNewCustomerChange}
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={newCustomer.email}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Enter email address"
                  required
                  autoComplete="email"
                  onChange={handleNewCustomerChange}
                />
              </div>
              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700"
                >
                  Address
                </label>
                <textarea
                  name="address"
                  id="address"
                  value={newCustomer.address}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Enter address"
                  required
                  rows={3}
                  cols={50}
                  autoComplete="street-address"
                  autoFocus
                  spellCheck="false"
                  onChange={handleNewCustomerChange}
                />
              </div>
              <div>
                <label
                  htmlFor="type"
                  className="block text-sm font-medium text-gray-700"
                >
                  Type
                </label>
                <select
                  name="type"
                  id="type"
                  value={newCustomer.type}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  required
                  autoFocus
                  onChange={handleNewCustomerChange}
                >
                  <option value="Hospital">Hospital</option>
                  <option value="Clinic">Clinic</option>
                  <option value="Pharmacy">Pharmacy</option>
                  <option value="Non-profit">Non-profit</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="contactPerson"
                  className="block text-sm font-medium text-gray-700"
                >
                  Contact Person
                </label>
                <input
                  type="text"
                  name="contactPerson"
                  id="contactPerson"
                  value={newCustomer.contactPerson}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Enter contact person's name"
                  required
                  autoFocus
                  autoComplete="name"
                  spellCheck="false"
                  onChange={handleNewCustomerChange}
                />
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ml-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                onClick={handleAddCustomer}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {isEditModalOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Edit Customer</h3>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={selectedCustomer.name}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Enter customer name"
                  required
                  autoFocus
                  onChange={handleSelectedCustomerChange}
                />
              </div>
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700"
                >
                  Phone
                </label>
                <input
                  type="text"
                  name="phone"
                  id="phone"
                  value={selectedCustomer.phone}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Enter phone number"
                  required
                  pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
                  title="Please enter a valid phone number (123-456-7890)"
                  onChange={handleSelectedCustomerChange}
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={selectedCustomer.email}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Enter email address"
                  required
                  autoComplete="email"
                  onChange={handleSelectedCustomerChange}
                />
              </div>
              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700"
                >
                  Address
                </label>
                <textarea
                  name="address"
                  id="address"
                  value={selectedCustomer.address}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Enter address"
                  required
                  rows={3}
                  cols={50}
                  autoComplete="street-address"
                  autoFocus
                  spellCheck="false"
                  onChange={handleSelectedCustomerChange}
                />
              </div>
              <div>
                <label
                  htmlFor="type"
                  className="block text-sm font-medium text-gray-700"
                >
                  Type
                </label>
                <select
                  name="type"
                  id="type"
                  value={selectedCustomer.type}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  required
                  autoFocus
                  onChange={handleSelectedCustomerChange}
                >
                  <option value="Hospital">Hospital</option>
                  <option value="Clinic">Clinic</option>
                  <option value="Pharmacy">Pharmacy</option>
                  <option value="Non-profit">Non-profit</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="contactPerson"
                  className="block text-sm font-medium text-gray-700"
                >
                  Contact Person
                </label>
                <input
                  type="text"
                  name="contactPerson"
                  id="contactPerson"
                  value={selectedCustomer.contactPerson}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Enter contact person's name"
                  required
                  autoFocus
                  autoComplete="name"
                  spellCheck="false"
                  onChange={handleSelectedCustomerChange}
                />
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                onClick={() => {
                  setSelectedCustomer(null);
                  setIsEditModalOpen(false);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ml-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                onClick={handleEditCustomer}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Customer Modal */}
      {isDeleteModalOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-medium mb-4">Delete Customer</h3>
            <p className="text-sm text-gray-700 mb-4">
              Are you sure you want to delete {selectedCustomer.name}?
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                onClick={() => {
                  setSelectedCustomer(null);
                  setIsDeleteModalOpen(false);
                }}
              >
                No
              </button>
              <button
                type="button"
                className="ml-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                onClick={handleDeleteCustomer}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
