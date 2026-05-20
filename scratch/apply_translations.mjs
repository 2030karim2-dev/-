import fs from 'fs';

const enPath = './src/lib/locales/en.json';
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const missingTranslations = {
  "save_changes": "Save Changes",
  "ai_brain": "AI Brain",
  "alternative_numbers_label": "Alternative Numbers (comma separated)",
  "name_required": "Full name is required",
  "category_name_required": "Category name is required",
  "add_new_category": "Add New Category",
  "edit_category": "Edit Category",
  "organizational_category_desc": "Organize and classify customers / suppliers",
  "category_name_label": "Category Name",
  "category_name_placeholder": "e.g., wholesale, retail, companies...",
  "edit_entity": "Edit {{entity}}",
  "add_entity": "Add {{entity}}",
  "warehouse": "Warehouse / Branch",
  "warehouse_name_label": "Warehouse / Branch Name",
  "warehouse_name_placeholder": "Enter site name...",
  "warehouse_location_label": "Geographic Location",
  "warehouse_location_placeholder": "City, district, street...",
  "warehouse_name_required": "Warehouse name is required",
  "warehouse_desc": "Micro-UI Warehouse Profile",
  "default_warehouse_for_ops": "Default Warehouse for Operations",
  "inventory": "Inventory",
  "vehicles": "Vehicle Management",
  "invoice_settings": "Invoice Settings",
  "pos_settings": "POS Settings",
  "inventory_settings": "Inventory Settings",
  "print_settings": "Print Settings",
  "integrations_settings": "Integrations & Linking",
  "localization_settings": "Language & Region",
  "team_settings": "Team Management",
  "active": "Active",
  "blocked": "Blocked",
  "general": "General",
  "phone_number": "Phone Number",
  "email_address": "Email Address",
  "address": "Address"
};

// Merge missing translations into en
for (const [key, value] of Object.entries(missingTranslations)) {
  en[key] = value;
}

// Write back to en.json with proper spacing
fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n', 'utf8');
console.log('Successfully merged 35 translations into en.json!');
