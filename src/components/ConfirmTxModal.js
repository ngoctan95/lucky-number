import React from "react";

const ConfirmTxModal = ({ state }) => {
  return (
    <div>
      <p>
        <strong>Your Lucky Number:</strong> {state.number}
      </p>
      <p>
        <strong>Fee of Transaction:</strong> {state.txFee}
      </p>
      <p>
        <strong>Total:</strong> {state.totalTransfer}
      </p>
    </div>
  );
};

export default ConfirmTxModal;
