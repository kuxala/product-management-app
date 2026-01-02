import { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface BaseInputProps {
  label: string;
  error?: string;
}

interface InputProps
  extends BaseInputProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  type?: 'text' | 'email' | 'password' | 'number' | 'date';
}

interface TextareaProps
  extends BaseInputProps,
    Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  multiline: true;
  rows?: number;
}

type FormInputProps = InputProps | TextareaProps;

function isTextarea(props: FormInputProps): props is TextareaProps {
  return 'multiline' in props && props.multiline === true;
}

export function FormInput(props: FormInputProps) {
  const { label, error } = props;

  const baseClassName =
    'w-full px-4 py-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition';
  const errorClassName = error ? 'ring-2 ring-red-500 bg-red-50' : '';

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      {isTextarea(props) ? (
        <textarea
          {...props}
          className={`${baseClassName} ${errorClassName} resize-none`}
          rows={props.rows || 3}
        />
      ) : (
        <input
          {...props}
          className={`${baseClassName} ${errorClassName}`}
        />
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
