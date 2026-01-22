interface InputFieldInterface {
  title: string;
  type?: string;
  value: string;
  placeholder: string;
  autoComplete?: string;
  onChange: (val: string) => void;
}

const InputField = ({
  title,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
}: InputFieldInterface) => (
  <div>
    <label className='block text-sm font-medium text-gray-700 mb-1 italic'>{title}</label>
    <input
      className='w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all'
      type={type}
      placeholder={placeholder}
      value={value}
      autoComplete={autoComplete}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

export default InputField;
