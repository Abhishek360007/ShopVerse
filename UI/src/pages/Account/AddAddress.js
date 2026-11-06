import React, { useState } from 'react'
import { useDispatch } from 'react-redux';
import { setLoading } from '../../store/features/common';
import { addAddressAPI } from '../../api/userInfo';
import { saveAddress } from '../../store/features/user';

const fields = [
  { name: 'name', label: 'Full name', placeholder: 'Who should receive the order?', autoComplete: 'name' },
  { name: 'phoneNumber', label: 'Phone number', placeholder: '10-digit mobile number', autoComplete: 'tel', type: 'tel' },
  { name: 'street', label: 'Address', placeholder: 'House no., street, area', autoComplete: 'street-address' },
];

const AddAddress = ({ onCancel, onSaved }) => {
  const [values, setValues] = useState({ name: '', phoneNumber: '', street: '', city: '', state: '', zipCode: '' });
  const [error, setError] = useState('');
  const dispatch = useDispatch();

  const onChange = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

  const onSubmit = (evt) => {
    evt.preventDefault();
    dispatch(setLoading(true));
    setError('');
    addAddressAPI(values).then(res => {
      dispatch(saveAddress(res));
      onSaved && onSaved(res);
      onCancel && onCancel();
    }).catch(() => {
      setError('We could not save this address. Please try again.');
    }).finally(() => {
      dispatch(setLoading(false));
    });
  };

  return (
    <form onSubmit={onSubmit} className="grid max-w-xl gap-4">
      {fields.map((f) => (
        <div key={f.name}>
          <label className="label" htmlFor={`addr-${f.name}`}>{f.label}</label>
          <input id={`addr-${f.name}`} name={f.name} type={f.type ?? 'text'} value={values[f.name]} onChange={onChange}
                 placeholder={f.placeholder} autoComplete={f.autoComplete} className="input" required />
        </div>
      ))}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="addr-city">City</label>
          <input id="addr-city" name="city" value={values.city} onChange={onChange} autoComplete="address-level2" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="addr-state">State</label>
          <input id="addr-state" name="state" value={values.state} onChange={onChange} autoComplete="address-level1" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="addr-zip">PIN code</label>
          <input id="addr-zip" name="zipCode" value={values.zipCode} onChange={onChange} autoComplete="postal-code"
                 inputMode="numeric" pattern="[0-9]{6}" title="6-digit PIN code" className="input" required />
        </div>
      </div>
      {error && <p className="text-sm font-semibold text-red-400">{error}</p>}
      <div className="flex gap-3">
        {onCancel && <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>}
        <button type="submit" className="btn-primary">Save address</button>
      </div>
    </form>
  )
}

export default AddAddress
