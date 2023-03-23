import React, { useState } from 'react';

function AddRecordForm(props) {
  const [record, setRecord] = useState({ date: '', weight: '', file: null });

  const handleChange = (event) => {
    const { name, value, type } = event.target;
    if (type === 'file') {
      setRecord({ ...record, [name]: event.target.files[0] });
    } else {
      setRecord({ ...record, [name]: value });
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('date', record.date);
    formData.append('weight', record.weight);
    formData.append('file', record.file);
    props.onAddRecord(formData);
    setRecord({ date: '', weight: '', file: null });
    event.target.reset();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="add-w">
        <table className="add-form">
          <tr>
            <td className="pic-col"><img src="jotaro.png" alt="Image" width={357} height={513}/></td>
            <td>
              <div className="form-col">
              <div><input className="add-inps" type="date" name="date" placeholder="Date" value={record.date} onChange={handleChange} required /></div>      
              <div><input className="add-inp-w" type="number" name="weight" placeholder="Weight" value={record.weight} onChange={handleChange} required /></div>
              <div><input className="add-inps" type="file" name="file" onChange={handleChange} /></div>
              <div><button className="add-btn btn btn-sm btn-outline-danger" type="submit">Add</button></div>
              </div>
            </td>
          </tr>
        </table>
      </div>
    </form>
  );
}

export default AddRecordForm;