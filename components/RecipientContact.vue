<template>
  <div class="recipient-contact">
    <div class="recipient">
      <div class="recipient-profile">
        <img src="/profile.jpg" alt="Recipient">
        <span>Recipient</span>
      </div>
      <p class="recipient-id">ID: <span>222-111-33</span></p>
      <p class="recipient-name">Matthew Perry</p>
    </div>
    <a href="tel:+79001111111">
    <button>
      <svg width="33" height="32" viewBox="0 0 33 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clip-path="url(#clip0_1_252)">
        <path d="M27.5133 24.3031C25.0879 24.7507 22.6281 24.6678 20.1338 24.0545C17.6388 23.4421 15.3458 22.4468 13.2546 21.0686C11.1629 19.6913 9.37262 17.9966 7.88387 15.9847C6.3945 13.9736 5.435 11.8039 5.00536 9.47553C4.94541 9.15065 5.00826 8.8591 5.1939 8.60087C5.37955 8.34265 5.64158 8.18232 5.98 8.11987L10.5487 7.27682C10.8119 7.22825 11.0619 7.26611 11.2987 7.39039C11.5355 7.51466 11.696 7.69968 11.7802 7.94543L13.2129 11.6004C13.2971 11.8462 13.335 12.077 13.3266 12.2928C13.3176 12.5094 13.2435 12.7146 13.1043 12.9083L10.8865 16.0611C11.9159 17.2149 13.1278 18.251 14.5221 19.1696C15.9164 20.0881 17.4046 20.8306 18.9867 21.3972L21.168 18.3631C21.3073 18.1695 21.5058 18.0067 21.7638 17.8747C22.0211 17.7436 22.2847 17.6718 22.5546 17.6594L26.5863 17.6993C26.8595 17.7048 27.0982 17.7866 27.3023 17.9445C27.5065 18.1032 27.632 18.3088 27.6786 18.5615L28.4879 22.9475C28.5479 23.2723 28.485 23.5639 28.2994 23.8221C28.1137 24.0803 27.8517 24.2407 27.5133 24.3031Z" fill="white"/>
        </g>
        <defs>
        <clipPath id="clip0_1_252">
        <rect width="27.5307" height="26.4294" fill="white" transform="translate(0.812195 5.71466) rotate(-10.4551)"/>
        </clipPath>
        </defs>
      </svg>
      <span>Call</span>
    </button>
    </a>
  </div>
</template>

<script>
export default {
  name: 'RecipientContact',
};
</script>

<style lang="scss" scoped>
.recipient-contact {
  background-color: var(--tertiary-color);
  border-radius: var(--main-border-radius);
  transition: transform 0.3s ease-in-out;

  &:hover {
    transform: rotate(-10deg);
  }

}

.recipient {
  background-color: var(--primary-color);
  border-radius: var(--main-border-radius);
  color: #000;
  padding: var(--padding);
  font-size: var(--middle-font-size);

  .recipient-profile {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  img {
    width: 48px;
    height: 48px;
    border-radius: 10px;
  }

  p {
    margin: 10px 0;
  }

  .recipient-id {
    color: var(--tertiary-color);
  }

  .recipient-name {
    text-decoration: underline;
    font-weight: bold;
  }
}


button {
  width: calc(100% - 40px);
  display: flex;
  justify-content: center;
  gap: 20px;
  align-items: center;
  height: 50px;
  border-radius: var(--second-border-radius);
  margin: 20px;
  background-color: #a8a8a8;
  color: #fff;
}

a {
  text-decoration: none;
}

span {
  font-size: var(--middle-font-size);
}
</style>
