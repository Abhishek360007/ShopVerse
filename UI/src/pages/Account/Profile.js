import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { removeAddress, selectUserInfo } from "../../store/features/user";
import AddAddress from "./AddAddress";
import { setLoading } from "../../store/features/common";
import { deleteAddressAPI } from "../../api/userInfo";

const Profile = () => {
  const userInfo = useSelector(selectUserInfo);
  const [adding, setAdding] = useState(false);
  const dispatch = useDispatch();

  const onDeleteAddress = (id) => {
    dispatch(setLoading(true));
    deleteAddressAPI(id).then(() => dispatch(removeAddress(id)))
      .catch(() => {})
      .finally(() => dispatch(setLoading(false)));
  };

  const details = [
    ["Full name", [userInfo?.firstName, userInfo?.lastName].filter(Boolean).join(" ") || "—"],
    ["Email", userInfo?.email || "—"],
    ["Phone", userInfo?.phoneNumber || "—"],
  ];

  return (
    <div>
      <h2 className="text-xl font-extrabold">My details</h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-3">
        {details.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-raised p-4">
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</dt>
            <dd className="mt-1 break-words font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-xl font-extrabold">Addresses</h2>
        {!adding && <button type="button" onClick={() => setAdding(true)} className="text-sm font-semibold text-brand-pink hover:underline">+ Add new</button>}
      </div>

      {adding ? (
        <div className="mt-4"><AddAddress onCancel={() => setAdding(false)} /></div>
      ) : userInfo?.addressList?.length ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {userInfo.addressList.map((address) => (
            <div key={address.id} className="rounded-2xl border border-line bg-raised p-4 text-sm">
              <p className="font-bold">{address.name}</p>
              <p className="mt-1 text-muted">{address.street}, {address.city}, {address.state} {address.zipCode}</p>
              <p className="text-muted">{address.phoneNumber}</p>
              <button type="button" onClick={() => onDeleteAddress(address.id)} className="mt-3 text-sm font-semibold text-red-400 hover:underline">
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">No saved addresses yet.</p>
      )}
    </div>
  );
};

export default Profile;
